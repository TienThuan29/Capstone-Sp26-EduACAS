using AcasService.Application.Commands.Submission;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Submission;

[ApiController]
[Route("api/v1/submissions")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class SubmissionCommandController : ControllerBase
{
    private readonly ISubmissionCommand _submissionCommand;
    private readonly ILogger<SubmissionCommandController> _logger;

    public SubmissionCommandController(
        ISubmissionCommand submissionCommand,
        ILogger<SubmissionCommandController> logger)
    {
        _submissionCommand = submissionCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SubmissionResponse>>> SaveSubmission(
        [FromBody] SubmitProblemRequest request)
    {
        try
        {
            var result = await _submissionCommand.SubmitProblemAsync(request);
            if (result == null)
                return ResponseUtil.Error<SubmissionResponse>("Failed to save submission", 500);

            return ResponseUtil.Success(result, "Submission saved successfully", 201);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving submission");
            return ResponseUtil.Error<SubmissionResponse>("Failed to save submission", 500);
        }
    }

    [HttpPost("auto-grade")]
    public async Task<ActionResult<ApiResponse<AutoGradeProblemResponse>>> AutoGradeSubmissions(
        [FromBody] BulkSubmissionGradingRequest request)
    {
        try
        {
            var result = await _submissionCommand.AutoGradeAllSubmissionsOfProblemAysnc(request);
            return ResponseUtil.Success(result, "Auto-grading completed", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running auto-grading");
            return ResponseUtil.Error<AutoGradeProblemResponse>("Auto-grading failed", 500);
        }
    }
}
