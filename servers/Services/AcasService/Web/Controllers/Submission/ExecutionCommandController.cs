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
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
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
}