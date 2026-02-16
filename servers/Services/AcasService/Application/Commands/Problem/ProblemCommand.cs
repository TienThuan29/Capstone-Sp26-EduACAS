using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Web.Requests;
using Microsoft.Extensions.FileSystemGlobbing.Internal.PathSegments;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace AcasService.Application.Commands.Problem;

public interface IProblemCommand
{
    Task<ProblemResponse> CreateProblemAsync(CreateProblemRequest request);
    Task UpdateProblemAsync(string problemId, UpdateProblemRequest request);
    Task DeleteProblemAsync(string problemId);
    Task AddTestCaseAsync(string problemId, CreateTestCaseRequest request);
    Task AddBulkTestCasesAsync(string problemId, List<CreateTestCaseRequest> requests);
    Task UpdateTestCaseAsync(string problemId, string testCaseId, UpdateTestCaseRequest request);
    Task DeleteTestCaseAsync(string problemId, string testCaseId);
}

public class ProblemCommand : IProblemCommand
{
    private readonly Repositories.Problem.IProblemRepository _problemRepository;
    private readonly ILogger<ProblemCommand> _logger;
    private readonly ProblemMapper _problemMapper;

    public ProblemCommand(
        Repositories.Problem.IProblemRepository problemRepository,
        ILogger<ProblemCommand> logger,
        ProblemMapper problemMapper)
    {
        _problemRepository = problemRepository;
        _logger = logger;
        _problemMapper = problemMapper;
    }

    public async Task<ProblemResponse> CreateProblemAsync(CreateProblemRequest request)
    {
        try
        {
            var problem = new Models.Problem
            {
                LecturerId = request.LecturerId,
                Title = request.Title,
                //Content = request.Content,
                //FileName = request.FileName,
                Difficulty = Enum.Parse<Difficulty>(request.Difficulty),
                CodeTemplates = string.IsNullOrEmpty(request.CodeTemplate) ? new Dictionary<string, string>() : new Dictionary<string, string> { ["default"] = request.CodeTemplate }
            };

            if (request.Mode == "MANUAL")
            {
                ValidateString(request.Content, 10, 50000, "Content");
                problem.Content = request.Content;
                problem.FileName = string.Empty;
                _logger.LogInformation("Creating problem in MANUAL mode: {Title}, FileName: {FileName}", request.Title, request.FileName);
            }
            else if (request.Mode == "FROM_FILE")
            {
                if (request.WantsToEdit)
                {
                    ValidateString(request.Content, 10, 50000, "Content");
                    problem.Content = request.Content;
                    problem.FileName = string.Empty;
                    _logger.LogInformation("Creating problem in FROM_FILE mode with edits: {Title}", request.Title);

                }
                else
                {
                    ValidateString(request.FileName, 1, 255, "FileName");
                    var regex = new Regex(@"^[a-zA-Z0-9_\-\.]+$");
                    if (!regex.IsMatch(request.FileName))
                        throw new ValidationException("FileName can only contain letters, numbers, underscores, hyphens, and dots");
                    problem.Content = string.Empty;
                    problem.FileName = request.FileName;
                    _logger.LogInformation("Creating problem in FROM_FILE mode without edits: {Title}, FileName: {FileName}", request.Title, request.FileName);
                }
            } else
            {
                throw new ArgumentException($"Invalid mode: {request.Mode}. Must be MANUAL or FROM_FILE");
            }

            if (request.TestCases != null && request.TestCases.Any())
                {
                    foreach (var testCaseRequest in request.TestCases)
                    {
                        var testCase = new TestCase
                        {
                            Id = Guid.NewGuid().ToString(),
                            InputData = testCaseRequest.InputData,
                            ExpectedOutput = testCaseRequest.ExpectedOutput,
                            IsPublic = testCaseRequest.IsPublic,
                            IsCaseInsensitive = testCaseRequest.IsCaseInsensitive,
                            IsFloatingPoint = testCaseRequest.IsFloatingPoint,
                            FloatingPointTolerance = testCaseRequest.FloatingPointTolerance,
                            DecimalPlaces = testCaseRequest.DecimalPlaces,
                            IsTokenComparision = testCaseRequest.IsTokenComparision,
                            IsDeleted = false
                        };
                        problem.TestCases.Add(testCase);
                    }
                }

            var createdProblem = await _problemRepository.CreateAsync(problem);
            _logger.LogInformation("Problem created with ID {ProblemId} and {TestCaseCount} test cases", 
                createdProblem.Id, createdProblem.TestCases.Count);
            return _problemMapper.ToProblemResponse(createdProblem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating problem");
            throw;
        }
    }

    public async Task UpdateProblemAsync(string problemId, UpdateProblemRequest request)
    {
        try
        {
            var problem = await _problemRepository.GetByIdAsync(problemId);
            if (problem == null)
            {
                throw new KeyNotFoundException($"Problem {problemId} not found");
            }

            problem.Title = request.Title;
            problem.Difficulty = Enum.Parse<Difficulty>(request.Difficulty);
            problem.CodeTemplates = string.IsNullOrEmpty(request.CodeTemplate) ? new Dictionary<string, string>() : new Dictionary<string, string> { ["default"] = request.CodeTemplate };

            
            if (!string.IsNullOrWhiteSpace(request.FileName))
            {
                ValidateString(request.FileName, 1, 255, "FileName");
                var regex = new Regex(@"^[a-zA-Z0-9_\-\.]+$");
                if (!regex.IsMatch(request.FileName))
                    throw new ValidationException("FileName can only contain letters, numbers, underscores, hyphens, and dots");
                
                problem.FileName = request.FileName;
                problem.Content = string.Empty;
                 _logger.LogInformation("Updating problem {ProblemId} with file: {FileName}", problemId, request.FileName);
            }
            else
            {
                ValidateString(request.Content, 10, 50000, "Content");
                problem.Content = request.Content;
                problem.FileName = string.Empty;
                 _logger.LogInformation("Updating problem {ProblemId} with manual content", problemId);
            }

            // Update test cases if provided - replace all existing test cases with new ones
            if (request.TestCases != null)
            {
                // Clear existing test cases and add new ones
                problem.TestCases.Clear();
                
                foreach (var testCaseRequest in request.TestCases)
                {
                    var testCase = new TestCase
                    {
                        Id = Guid.NewGuid().ToString(),
                        ProblemId = problemId,
                        InputData = testCaseRequest.InputData,
                        ExpectedOutput = testCaseRequest.ExpectedOutput,
                        IsPublic = testCaseRequest.IsPublic,
                        IsCaseInsensitive = testCaseRequest.IsCaseInsensitive,
                        IsFloatingPoint = testCaseRequest.IsFloatingPoint,
                        FloatingPointTolerance = testCaseRequest.FloatingPointTolerance,
                        DecimalPlaces = testCaseRequest.DecimalPlaces,
                        IsTokenComparision = testCaseRequest.IsTokenComparision,
                        IsDeleted = false
                    };
                    problem.TestCases.Add(testCase);
                }
                
                _logger.LogInformation("Problem {ProblemId} test cases replaced with {TestCaseCount} new test cases", 
                    problemId, request.TestCases.Count);
            }

            await _problemRepository.UpdateAsync(problem);
            _logger.LogInformation("Problem {ProblemId} updated successfully", problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task DeleteProblemAsync(string problemId)
    {
        try
        {
            await _problemRepository.DeleteAsync(problemId);
            _logger.LogInformation("Problem {ProblemId} deleted successfully", problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task AddTestCaseAsync(string problemId, CreateTestCaseRequest request)
    {
        try
        {
            var problemExists = await _problemRepository.ExistsAsync(problemId);
            if (!problemExists)
            {
                throw new KeyNotFoundException($"Problem {problemId} not found");
            }

            var testCase = new TestCase
            {
                ProblemId = problemId,
                InputData = request.InputData,
                ExpectedOutput = request.ExpectedOutput,
                IsPublic = request.IsPublic,
                IsCaseInsensitive = request.IsCaseInsensitive,
                IsFloatingPoint = request.IsFloatingPoint,
                FloatingPointTolerance = request.FloatingPointTolerance,
                DecimalPlaces = request.DecimalPlaces,
                IsTokenComparision = request.IsTokenComparision
            };

            await _problemRepository.AddTestCaseAsync(problemId, testCase);
            _logger.LogInformation("Test case added to problem {ProblemId}", problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding test case to problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task AddBulkTestCasesAsync(string problemId, List<CreateTestCaseRequest> requests)
    {
        try
        {
            var problemExists = await _problemRepository.ExistsAsync(problemId);
            if (!problemExists)
            {
                throw new KeyNotFoundException($"Problem {problemId} not found");
            }

            foreach (var request in requests)
            {
                var testCase = new TestCase
                {
                    ProblemId = problemId,
                    InputData = request.InputData,
                    ExpectedOutput = request.ExpectedOutput,
                    IsPublic = request.IsPublic,
                    IsCaseInsensitive = request.IsCaseInsensitive,
                    IsFloatingPoint = request.IsFloatingPoint,
                    FloatingPointTolerance = request.FloatingPointTolerance,
                    DecimalPlaces = request.DecimalPlaces,
                    IsTokenComparision = request.IsTokenComparision
                };

                await _problemRepository.AddTestCaseAsync(problemId, testCase);
            }

            _logger.LogInformation("{Count} test cases added to problem {ProblemId}", requests.Count, problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding bulk test cases to problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task UpdateTestCaseAsync(string problemId, string testCaseId, UpdateTestCaseRequest request)
    {
        try
        {
            var testCase = await _problemRepository.GetTestCaseAsync(problemId, testCaseId);
            if (testCase == null)
            {
                throw new KeyNotFoundException($"Test case {testCaseId} not found for problem {problemId}");
            }

            testCase.InputData = request.InputData;
            testCase.ExpectedOutput = request.ExpectedOutput;
            testCase.IsPublic = request.IsPublic;
            testCase.IsCaseInsensitive = request.IsCaseInsensitive;
            testCase.IsFloatingPoint = request.IsFloatingPoint;
            testCase.FloatingPointTolerance = request.FloatingPointTolerance;
            testCase.DecimalPlaces = request.DecimalPlaces;
            testCase.IsTokenComparision = request.IsTokenComparision;

            await _problemRepository.UpdateTestCaseAsync(problemId, testCase);
            _logger.LogInformation("Test case {TestCaseId} updated for problem {ProblemId}", testCaseId, problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating test case {TestCaseId} for problem {ProblemId}", testCaseId, problemId);
            throw;
        }
    }

    public async Task DeleteTestCaseAsync(string problemId, string testCaseId)
    {
        try
        {
            await _problemRepository.DeleteTestCaseAsync(problemId, testCaseId);
            _logger.LogInformation("Test case {TestCaseId} deleted from problem {ProblemId}", testCaseId, problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting test case {TestCaseId} from problem {ProblemId}", testCaseId, problemId);
            throw;
        }
    }

    void ValidateString(string? value, int min, int max, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ValidationException($"{fieldName} is required");
        if (value.Length < min || value.Length > max)
            throw new ValidationException($"{fieldName} must be between {min} and {max} characters");
    }
}
