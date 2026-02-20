using System.Linq;
using AcasService.Application.Commands.Submission;
using AcasService.Application.ResponseDTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Application.Utils;
using AcasService.Web.Requests;

namespace AcasService.Web.Controllers.Submission;

[ApiController]
[Route("api/v1/submissions")]
// [Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class ExecutionCommandController : ControllerBase
{
    private readonly IExecutionCommand _executionCommand;

    private readonly ILogger<ExecutionCommandController> _logger;

    public ExecutionCommandController(
        IExecutionCommand executionCommand,
        ILogger<ExecutionCommandController> logger)
    {
        _executionCommand = executionCommand;
        _logger = logger;
    }

    [HttpPost("execute/custom-testcase")]
    public async Task<ActionResult<ApiResponse<CompilationResult>>> ExecuteCustomTestcase(
        [FromBody] CustomTestcaseRequest customTestcaseRequest)
    {
        try
        {
            var result = await _executionCommand.ExecuteCustomTestcaseAsync(
                customTestcaseRequest.CompilerId,
                customTestcaseRequest.CompileRequest,
                customTestcaseRequest.Lang);
            return ResponseUtil.Success(result, "Custom testcase executed successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing custom testcase");
            return ResponseUtil.Error<CompilationResult>("Internal Server Error", 500);
        }
    }

    [HttpPost("execute/public-testcases")]
    public async Task<ActionResult<ApiResponse<List<TestResultResponse>>>> ExecutePublicTestcases(
        [FromBody] PublicTestcasesRequest publicTestcasesRequest)
    {
        try
        {
            var results = await _executionCommand.ExecutePublicTestcasesAsync(
                publicTestcasesRequest.CompilerId,
                publicTestcasesRequest.RunBatchRequest,
                publicTestcasesRequest.Lang
            );
            var message = GetMessageForPublicTestcasesResult(results);
            return ResponseUtil.Success(results, message, 200);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation while executing public testcases");
            return ResponseUtil.Error<List<TestResultResponse>>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing public testcases");
            return ResponseUtil.Error<List<TestResultResponse>>(
                "Failed to execute public testcases",
                error: ex.Message,
                statusCode: 500);
        }
    }

    private string GetMessageForPublicTestcasesResult(List<TestResultResponse> results)
    {
        if (results == null || results.Count == 0)
            return "No test results.";

        var hasCompileError = results.Any(r => r.Status == "COMPILE_ERROR");
        var hasRuntimeError = results.Any(r => r.Status == "RUNTIME_ERROR");
        var hasUnknownError = results.Any(r => r.Status == "UNKNOWN_ERROR");
        var hasTimeout = results.Any(r => r.Status == "TIMEOUT");
        var hasFail = results.Any(r => r.Status == "FAIL");
        var successCount = results.Count(r => r.Status == "SUCCESS");
        var total = results.Count;

        if (hasCompileError)
            return "Compilation failed.";
        if (hasRuntimeError)
            return "Runtime error occurred.";
        if (hasUnknownError)
            return "Unknown error occurred.";
        if (hasTimeout)
            return "Timeout occurred.";
        if (hasFail)
            return successCount == 0
                ? "All test cases failed."
                : $"{successCount} passed, {total - successCount} failed.";
        return total == 1
            ? "Test case passed."
            : $"All {total} test cases passed.";
    }
}