using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Queries.Problem;

public interface IProblemQuery
{
    Task<ProblemResponseDTO?> GetProblemByIdAsync(string problemId);
    Task<List<ProblemBasicDTO>> GetProblemsByExamIdAsync(string examId);
    Task<List<ProblemBasicDTO>> GetProblemsByLecturerIdAsync(string lecturerId);
    Task<List<ProblemBasicDTO>> GetAllProblemsAsync();
    Task<List<TestCaseResponseDTO>> GetTestCasesByProblemIdAsync(string problemId);
    Task<TestCaseResponseDTO?> GetTestCaseAsync(string problemId, string testCaseId);
}

public class ProblemQuery : IProblemQuery
{
    private readonly Repositories.Problem.IProblemRepository _problemRepository;
    private readonly ILogger<ProblemQuery> _logger;

    public ProblemQuery(Repositories.Problem.IProblemRepository problemRepository, ILogger<ProblemQuery> logger)
    {
        _problemRepository = problemRepository;
        _logger = logger;
    }

    public async Task<ProblemResponseDTO?> GetProblemByIdAsync(string problemId)
    {
        try
        {
            var problem = await _problemRepository.GetByIdAsync(problemId);
            if (problem == null || problem.IsDeleted)
                return null;

            var testCases = await _problemRepository.GetTestCasesByProblemIdAsync(problemId);

            return new ProblemResponseDTO
            {
                Id = problem.Id,
                ExamId = problem.ExamId,
                LecturerId = problem.LecturerId,
                Title = problem.Title,
                Content = problem.Content,
                FileName = problem.FileName,
                Mark = problem.Mark,
                Difficulty = problem.Difficulty,
                CodeTemplate = problem.CodeTemplate,
                CreatedDate = problem.CreatedDate,
                UpdatedDate = problem.UpdatedDate,
                TestCases = testCases
                    .Where(tc => !tc.IsDeleted)
                    .Select(tc => new TestCaseResponseDTO
                    {
                        Id = tc.Id,
                        InputData = tc.InputData,
                        ExpectedOutput = tc.ExpectedOutput,
                        IsPublic = tc.IsPublic,
                        IsCaseInsensitive = tc.IsCaseInsensitive,
                        IsRemovedSpace = tc.IsRemovedSpace
                    })
                    .ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task<List<ProblemBasicDTO>> GetProblemsByExamIdAsync(string examId)
    {
        try
        {
            var problems = await _problemRepository.GetByExamIdAsync(examId);
            return problems
                .Where(p => !p.IsDeleted)
                .Select(p => new ProblemBasicDTO
                {
                    Id = p.Id,
                    ExamId = p.ExamId,
                    Title = p.Title,
                    Mark = p.Mark,
                    Difficulty = p.Difficulty,
                    CreatedDate = p.CreatedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task<List<ProblemBasicDTO>> GetProblemsByLecturerIdAsync(string lecturerId)
    {
        try
        {
            var problems = await _problemRepository.GetByLecturerIdAsync(lecturerId);
            return problems
                .Where(p => !p.IsDeleted)
                .Select(p => new ProblemBasicDTO
                {
                    Id = p.Id,
                    ExamId = p.ExamId,
                    Title = p.Title,
                    Mark = p.Mark,
                    Difficulty = p.Difficulty,
                    CreatedDate = p.CreatedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for lecturer {LecturerId}", lecturerId);
            throw;
        }
    }

    public async Task<List<ProblemBasicDTO>> GetAllProblemsAsync()
    {
        try
        {
            var problems = await _problemRepository.GetAllAsync();
            return problems
                .Where(p => !p.IsDeleted)
                .Select(p => new ProblemBasicDTO
                {
                    Id = p.Id,
                    ExamId = p.ExamId,
                    Title = p.Title,
                    Mark = p.Mark,
                    Difficulty = p.Difficulty,
                    CreatedDate = p.CreatedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all problems");
            throw;
        }
    }

    public async Task<List<TestCaseResponseDTO>> GetTestCasesByProblemIdAsync(string problemId)
    {
        try
        {
            var testCases = await _problemRepository.GetTestCasesByProblemIdAsync(problemId);
            return testCases
                .Where(tc => !tc.IsDeleted)
                .Select(tc => new TestCaseResponseDTO
                {
                    Id = tc.Id,
                    InputData = tc.InputData,
                    ExpectedOutput = tc.ExpectedOutput,
                    IsPublic = tc.IsPublic,
                    IsCaseInsensitive = tc.IsCaseInsensitive,
                    IsRemovedSpace = tc.IsRemovedSpace
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test cases for problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task<TestCaseResponseDTO?> GetTestCaseAsync(string problemId, string testCaseId)
    {
        try
        {
            var testCase = await _problemRepository.GetTestCaseAsync(problemId, testCaseId);
            if (testCase == null || testCase.IsDeleted)
                return null;

            return new TestCaseResponseDTO
            {
                Id = testCase.Id,
                InputData = testCase.InputData,
                ExpectedOutput = testCase.ExpectedOutput,
                IsPublic = testCase.IsPublic,
                IsCaseInsensitive = testCase.IsCaseInsensitive,
                IsRemovedSpace = testCase.IsRemovedSpace
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test case {TestCaseId} for problem {ProblemId}", testCaseId, problemId);
            throw;
        }
    }
}
