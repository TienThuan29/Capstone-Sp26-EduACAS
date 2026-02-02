using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Web.Requests;
using Microsoft.Extensions.FileSystemGlobbing.Internal.PathSegments;

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
                Content = request.Content,
                FileName = request.FileName,
                Difficulty = Enum.Parse<Difficulty>(request.Difficulty),
                CodeTemplate = request.CodeTemplate
            };

            // Add test cases if provided
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
                        IsRemovedSpace = testCaseRequest.IsRemovedSpace,
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
            problem.Content = request.Content;
            problem.FileName = request.FileName;
            problem.Difficulty = Enum.Parse<Difficulty>(request.Difficulty);
            problem.CodeTemplate = request.CodeTemplate;

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
                        InputData = testCaseRequest.InputData,
                        ExpectedOutput = testCaseRequest.ExpectedOutput,
                        IsPublic = testCaseRequest.IsPublic,
                        IsCaseInsensitive = testCaseRequest.IsCaseInsensitive,
                        IsRemovedSpace = testCaseRequest.IsRemovedSpace,
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
                InputData = request.InputData,
                ExpectedOutput = request.ExpectedOutput,
                IsPublic = request.IsPublic,
                IsCaseInsensitive = request.IsCaseInsensitive,
                IsRemovedSpace = request.IsRemovedSpace
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
                    InputData = request.InputData,
                    ExpectedOutput = request.ExpectedOutput,
                    IsPublic = request.IsPublic,
                    IsCaseInsensitive = request.IsCaseInsensitive,
                    IsRemovedSpace = request.IsRemovedSpace
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
            testCase.IsRemovedSpace = request.IsRemovedSpace;

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
}
