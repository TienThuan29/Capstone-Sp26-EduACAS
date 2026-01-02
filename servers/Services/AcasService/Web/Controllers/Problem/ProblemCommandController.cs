using AcasService.Application.Commands.Problem;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Problem;

[ApiController]
[Route("api/v1/problems")]
public class ProblemCommandController : ControllerBase
{
    private readonly IProblemCommand _problemCommand;
    private readonly ILogger<ProblemCommandController> _logger;

    public ProblemCommandController(IProblemCommand problemCommand, ILogger<ProblemCommandController> logger)
    {
        _problemCommand = problemCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> CreateProblem([FromBody] CreateProblemRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.ExamId))
            {
                return ResponseUtil.Error<object>("Title and ExamId are required.", statusCode: 400);
            }

            var problemId = await _problemCommand.CreateProblemAsync(request);
            return ResponseUtil.Success(
                new { id = problemId },
                "Problem created successfully.",
                statusCode: 201
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating problem");
            return ResponseUtil.Error<object>(
                "Failed to create problem.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpPut("{problemId}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateProblem(
        [FromRoute] string problemId,
        [FromBody] UpdateProblemRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(problemId))
            {
                return ResponseUtil.Error<object>("Problem ID is required.", statusCode: 400);
            }

            await _problemCommand.UpdateProblemAsync(problemId, request);
            return ResponseUtil.Success(
                new { message = "Problem updated successfully" },
                "Problem updated successfully."
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Problem {ProblemId} not found", problemId);
            return ResponseUtil.Error<object>(ex.Message, statusCode: 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating problem {ProblemId}", problemId);
            return ResponseUtil.Error<object>(
                "Failed to update problem.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpDelete("{problemId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProblem([FromRoute] string problemId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(problemId))
            {
                return ResponseUtil.Error<object>("Problem ID is required.", statusCode: 400);
            }

            await _problemCommand.DeleteProblemAsync(problemId);
            return ResponseUtil.Success(
                new { message = "Problem deleted successfully" },
                "Problem deleted successfully."
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Problem {ProblemId} not found", problemId);
            return ResponseUtil.Error<object>(ex.Message, statusCode: 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting problem {ProblemId}", problemId);
            return ResponseUtil.Error<object>(
                "Failed to delete problem.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpPost("{problemId}/test-cases")]
    public async Task<ActionResult<ApiResponse<object>>> AddTestCase(
        [FromRoute] string problemId,
        [FromBody] CreateTestCaseRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(problemId))
            {
                return ResponseUtil.Error<object>("Problem ID is required.", statusCode: 400);
            }

            if (string.IsNullOrWhiteSpace(request.InputData) || string.IsNullOrWhiteSpace(request.ExpectedOutput))
            {
                return ResponseUtil.Error<object>(
                    "InputData and ExpectedOutput are required.",
                    statusCode: 400
                );
            }

            await _problemCommand.AddTestCaseAsync(problemId, request);
            return ResponseUtil.Success(
                new { message = "Test case added successfully" },
                "Test case added successfully.",
                statusCode: 201
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Problem {ProblemId} not found", problemId);
            return ResponseUtil.Error<object>(ex.Message, statusCode: 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding test case to problem {ProblemId}", problemId);
            return ResponseUtil.Error<object>(
                "Failed to add test case.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpPut("{problemId}/test-cases/{testCaseId}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateTestCase(
        [FromRoute] string problemId,
        [FromRoute] string testCaseId,
        [FromBody] UpdateTestCaseRequest request)
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

            await _problemCommand.UpdateTestCaseAsync(problemId, testCaseId, request);
            return ResponseUtil.Success(
                new { message = "Test case updated successfully" },
                "Test case updated successfully."
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Test case {TestCaseId} not found for problem {ProblemId}", testCaseId, problemId);
            return ResponseUtil.Error<object>(ex.Message, statusCode: 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating test case {TestCaseId} for problem {ProblemId}", testCaseId, problemId);
            return ResponseUtil.Error<object>(
                "Failed to update test case.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }

    [HttpDelete("{problemId}/test-cases/{testCaseId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTestCase(
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

            await _problemCommand.DeleteTestCaseAsync(problemId, testCaseId);
            return ResponseUtil.Success(
                new { message = "Test case deleted successfully" },
                "Test case deleted successfully."
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Test case {TestCaseId} not found for problem {ProblemId}", testCaseId, problemId);
            return ResponseUtil.Error<object>(ex.Message, statusCode: 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting test case {TestCaseId} for problem {ProblemId}", testCaseId, problemId);
            return ResponseUtil.Error<object>(
                "Failed to delete test case.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }
}
