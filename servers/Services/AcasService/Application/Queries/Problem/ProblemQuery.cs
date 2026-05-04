using AcasService.Application.Mappers;
using AcasService.Application.Queries.S3;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Examination;

namespace AcasService.Application.Queries.Problem;

public interface IProblemQuery
{
    Task<ProblemResponse?> GetProblemByIdAsync(string problemId);
    Task<List<ProblemResponse>> GetProblemsByIdsAsync(IEnumerable<string> problemIds);
    Task<List<ProblemBasicResponse>> GetProblemsByExamIdAsync(string examId);
    Task<List<ProblemBasicResponse>> GetProblemsByLecturerIdAsync(string lecturerId);
    Task<PagedResult<ProblemBasicResponse>> GetProblemsByLecturerIdPagedAsync(
        string lecturerId,
        int pageIndex = 1,
        int pageSize = 10,
        string? searchTerm = null,
        string? difficulty = null);
    Task<List<ProblemBasicResponse>> GetAllProblemsAsync();
    Task<List<TestCaseResponse>> GetTestCasesByProblemIdAsync(string problemId);
    Task<TestCaseResponse?> GetTestCaseAsync(string problemId, string testCaseId);
    Task<List<ProblemBasicResponse>> GetProblemsFromExaminationsByClassroomIdAsync(string classroomId);
}

public class ProblemQuery : IProblemQuery
{
    private readonly Repositories.Problem.IProblemRepository _problemRepository;
    private readonly Repositories.Classroom.IClassroomRepository _classroomRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IPrivateS3Query _privateS3Query;
    private readonly ILogger<ProblemQuery> _logger;

    public ProblemQuery(
        Repositories.Problem.IProblemRepository problemRepository,
        Repositories.Classroom.IClassroomRepository classroomRepository,
        IExaminationRepository examinationRepository,
        IPrivateS3Query privateS3Query,
        ILogger<ProblemQuery> logger)
    {
        _problemRepository = problemRepository;
        _classroomRepository = classroomRepository;
        _examinationRepository = examinationRepository;
        _privateS3Query = privateS3Query;
        _logger = logger;
    }

    public async Task<ProblemResponse?> GetProblemByIdAsync(string problemId)
    {
        try
        {
            var problem = await _problemRepository.GetByIdAsync(problemId);
            if (problem == null || problem.IsDeleted)
                return null;

            var testCases = await _problemRepository.GetTestCasesByProblemIdAsync(problemId);

            string fileUrl = string.Empty;
            if (!string.IsNullOrWhiteSpace(problem.FileName))
            {
                try
                {
                    fileUrl = await _privateS3Query.GetFileUrlAsync(problem.FileName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not generate presigned URL for file {FileName}", problem.FileName);
                }
            }

            var mapper = new ProblemMapper();
            return mapper.ToProblemResponse(problem, fileUrl, testCases);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task<List<ProblemResponse>> GetProblemsByIdsAsync(IEnumerable<string> problemIds)
    {
        try
        {
            var problems = (await _problemRepository.GetByIdsAsync(problemIds)).Where(p => !p.IsDeleted).ToList();
            var fileNames = problems.Where(p => !string.IsNullOrWhiteSpace(p.FileName)).Select(p => p.FileName!).ToList();
            var fileUrls = await _privateS3Query.GetFileUrlsAsync(fileNames);
            var mapper = new ProblemMapper();
            return problems
                .Select(problem =>
                {
                    var fileUrl = !string.IsNullOrWhiteSpace(problem.FileName)
                        ? (fileUrls.GetValueOrDefault(problem.FileName) ?? string.Empty)
                        : string.Empty;
                    return mapper.ToProblemResponse(problem, fileUrl, problem.TestCases ?? new List<TestCase>());
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems by ids");
            throw;
        }
    }

    public async Task<List<ProblemBasicResponse>> GetProblemsByExamIdAsync(string examId)
    {
        try
        {
            var problems = await _problemRepository.GetByExamIdAsync(examId);
            return problems
                .Where(p => !p.IsDeleted)
                .Select(p => new ProblemBasicResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    Difficulty = p.Difficulty,
                    Tags = p.Tags?.ToList() ?? new List<string>(),
                    TestCasesCount = p.TestCases?.Count(tc => !tc.IsDeleted) ?? 0,
                    CreatedDate = p.CreatedDate,
                    UpdatedDate = p.UpdatedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task<List<ProblemBasicResponse>> GetProblemsByLecturerIdAsync(string lecturerId)
    {
        try
        {
            var problems = await _problemRepository.GetByLecturerIdAsync(lecturerId);
            return problems
                .Where(p => !p.IsDeleted)
                .Select(p => new ProblemBasicResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    Difficulty = p.Difficulty,
                    Tags = p.Tags?.ToList() ?? new List<string>(),
                    TestCasesCount = p.TestCases?.Count(tc => !tc.IsDeleted) ?? 0,
                    CreatedDate = p.CreatedDate,
                    UpdatedDate = p.UpdatedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for lecturer {LecturerId}", lecturerId);
            throw;
        }
    }

    public async Task<PagedResult<ProblemBasicResponse>> GetProblemsByLecturerIdPagedAsync(
        string lecturerId,
        int pageIndex = 1,
        int pageSize = 10,
        string? searchTerm = null,
        string? difficulty = null)
    {
        try
        {
            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var all = await _problemRepository.GetByLecturerIdAsync(lecturerId);
            var query = all
                .Where(p => !p.IsDeleted)
                .AsEnumerable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLowerInvariant();
                query = query.Where(p =>
                    (p.Title?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
            }

            if (!string.IsNullOrWhiteSpace(difficulty) &&
                Enum.TryParse<Difficulty>(difficulty.Trim(), true, out var difficultyFilter))
            {
                query = query.Where(p => p.Difficulty == difficultyFilter);
            }

            var list = query
                .Select(p => new ProblemBasicResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    Difficulty = p.Difficulty,
                    Tags = p.Tags?.ToList() ?? new List<string>(),
                    TestCasesCount = p.TestCases?.Count(tc => !tc.IsDeleted) ?? 0,
                    CreatedDate = p.CreatedDate,
                    UpdatedDate = p.UpdatedDate
                })
                .ToList();

            var totalCount = list.Count;
            var items = list
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<ProblemBasicResponse>(items, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving paged problems for lecturer {LecturerId}", lecturerId);
            throw;
        }
    }

    public async Task<List<ProblemBasicResponse>> GetAllProblemsAsync()
    {
        try
        {
            var problems = await _problemRepository.GetAllAsync();
            return problems
                .Where(p => !p.IsDeleted)
                .Select(p => new ProblemBasicResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    Difficulty = p.Difficulty,
                    Tags = p.Tags?.ToList() ?? new List<string>(),
                    TestCasesCount = p.TestCases?.Count(tc => !tc.IsDeleted) ?? 0,
                    CreatedDate = p.CreatedDate,
                    UpdatedDate = p.UpdatedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all problems");
            throw;
        }
    }

    public async Task<List<TestCaseResponse>> GetTestCasesByProblemIdAsync(string problemId)
    {
        try
        {
            var testCases = await _problemRepository.GetTestCasesByProblemIdAsync(problemId);
            return testCases
                .Where(tc => !tc.IsDeleted)
                .Select(tc => new TestCaseResponse
                {
                    Id = tc.Id,
                    ProblemId = tc.ProblemId,
                    InputData = tc.InputData,
                    ExpectedOutput = tc.ExpectedOutput,
                    IsPublic = tc.IsPublic,
                    IsCaseInsensitive = tc.IsCaseInsensitive,
                    IsFloatingPoint = tc.IsFloatingPoint,
                    FloatingPointTolerance = tc.FloatingPointTolerance,
                    DecimalPlaces = tc.DecimalPlaces,
                    IsTokenComparision = tc.IsTokenComparision,
                    IsNotOrderedComparision = tc.IsNotOrderedComparision
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test cases for problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task<TestCaseResponse?> GetTestCaseAsync(string problemId, string testCaseId)
    {
        try
        {
            var testCase = await _problemRepository.GetTestCaseAsync(problemId, testCaseId);
            if (testCase == null || testCase.IsDeleted)
                return null;

            return new TestCaseResponse
            {
                Id = testCase.Id,
                ProblemId = testCase.ProblemId,
                InputData = testCase.InputData,
                ExpectedOutput = testCase.ExpectedOutput,
                IsPublic = testCase.IsPublic,
                IsCaseInsensitive = testCase.IsCaseInsensitive,
                IsFloatingPoint = testCase.IsFloatingPoint,
                FloatingPointTolerance = testCase.FloatingPointTolerance,
                DecimalPlaces = testCase.DecimalPlaces,
                IsTokenComparision = testCase.IsTokenComparision,
                IsNotOrderedComparision = testCase.IsNotOrderedComparision
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test case {TestCaseId} for problem {ProblemId}", testCaseId, problemId);
            throw;
        }
    }

    public async Task<List<ProblemBasicResponse>> GetProblemsFromExaminationsByClassroomIdAsync(string classroomId)
    {
        try
        {
            var examinations = await _examinationRepository.GetByClassIdAsync(classroomId);
            if (examinations == null || examinations.Count == 0)
            {
                return new List<ProblemBasicResponse>();
            }

            var problemIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var exam in examinations)
            {
                if (exam.Problems == null) continue;

                bool shouldInclude = exam.Mode switch
                {
                    Mode.PRACTICAL => true,
                    Mode.EXAMINATION => exam.Status == Status.COMPLETED,
                    _ => false,
                };

                if (!shouldInclude) continue;

                foreach (var ep in exam.Problems)
                {
                    if (!string.IsNullOrWhiteSpace(ep.ProblemId))
                        problemIds.Add(ep.ProblemId);
                }
            }

            if (problemIds.Count == 0)
            {
                return new List<ProblemBasicResponse>();
            }

            var problems = await _problemRepository.GetByIdsAsync(problemIds);
            return problems
                .Where(p => !p.IsDeleted)
                .Select(p => new ProblemBasicResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    Difficulty = p.Difficulty,
                    Tags = p.Tags?.ToList() ?? new List<string>(),
                    TestCasesCount = p.TestCases?.Count(tc => !tc.IsDeleted) ?? 0,
                    CreatedDate = p.CreatedDate,
                    UpdatedDate = p.UpdatedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for classroom {ClassroomId}", classroomId);
            throw;
        }
    }
}
