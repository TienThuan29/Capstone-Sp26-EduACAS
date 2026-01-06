using AcasService.Application.Queries.Problem;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Problem;

[ApiController]
[Route("api/v1/problems")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class ProblemQueryController : ControllerBase
{
    private readonly IProblemQuery _problemQuery;
    private readonly ILogger<ProblemQueryController> _logger;

    public ProblemQueryController(IProblemQuery problemQuery, ILogger<ProblemQueryController> logger)
    {
        _problemQuery = problemQuery;
        _logger = logger;
    }

    [HttpGet("{problemId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetProblemById([FromRoute] string problemId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(problemId))
            {
                return ResponseUtil.Error<object>("Problem ID is required.", statusCode: 400);
            }

            var problem = await _problemQuery.GetProblemByIdAsync(problemId);
            if (problem == null)
            {
                return ResponseUtil.Error<object>(
                    $"Problem {problemId} not found.",
                    statusCode: 404
                );
            }

            return ResponseUtil.Success(problem, "Problem retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problem {ProblemId}", problemId);
            return ResponseUtil.Error<object>(
                "Failed to retrieve problem.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpGet("exam/{examId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetProblemsByExamId([FromRoute] string examId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(examId))
            {
                return ResponseUtil.Error<object>("Exam ID is required.", statusCode: 400);
            }

            var problems = await _problemQuery.GetProblemsByExamIdAsync(examId);
            return ResponseUtil.Success(
                problems,
                $"Retrieved {problems.Count} problems for exam."
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for exam {ExamId}", examId);
            return ResponseUtil.Error<object>(
                "Failed to retrieve problems.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpGet("lecturer/{lecturerId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetProblemsByLecturerId([FromRoute] string lecturerId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(lecturerId))
            {
                return ResponseUtil.Error<object>("Lecturer ID is required.", statusCode: 400);
            }

            var problems = await _problemQuery.GetProblemsByLecturerIdAsync(lecturerId);
            return ResponseUtil.Success(
                problems,
                $"Retrieved {problems.Count} problems for lecturer."
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for lecturer {LecturerId}", lecturerId);
            return ResponseUtil.Error<object>(
                "Failed to retrieve problems.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAllProblems()
    {
        try
        {
            var problems = await _problemQuery.GetAllProblemsAsync();
            return ResponseUtil.Success(
                problems,
                $"Retrieved {problems.Count} problems."
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all problems");
            return ResponseUtil.Error<object>(
                "Failed to retrieve problems.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpGet("{problemId}/test-cases")]
    public async Task<ActionResult<ApiResponse<object>>> GetTestCasesByProblemId([FromRoute] string problemId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(problemId))
            {
                return ResponseUtil.Error<object>("Problem ID is required.", statusCode: 400);
            }

            var testCases = await _problemQuery.GetTestCasesByProblemIdAsync(problemId);
            return ResponseUtil.Success(
                testCases,
                $"Retrieved {testCases.Count} test cases."
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test cases for problem {ProblemId}", problemId);
            return ResponseUtil.Error<object>(
                "Failed to retrieve test cases.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpGet("{problemId}/test-cases/{testCaseId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTestCase(
        [FromRoute] string problemId,
        [FromRoute] string testCaseId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(problemId) || string.IsNullOrWhiteSpace(testCaseId))
            {
                return ResponseUtil.Error<object>(
                    "Problem ID and Test Case ID are required.",
                    statusCode: 400
                );
            }

            var testCase = await _problemQuery.GetTestCaseAsync(problemId, testCaseId);
            if (testCase == null)
            {
                return ResponseUtil.Error<object>(
                    $"Test case {testCaseId} not found.",
                    statusCode: 404
                );
            }

            return ResponseUtil.Success(testCase, "Test case retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test case {TestCaseId} for problem {ProblemId}", testCaseId, problemId);
            return ResponseUtil.Error<object>(
                "Failed to retrieve test case.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }
}
