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
            var userId = User.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userId) && !string.Equals(userId, request.StudentId, StringComparison.Ordinal))
                return ResponseUtil.Error<SubmissionResponse>("Student id does not match authenticated user", 403);

            var result = await _submissionCommand.SubmitProblemAsync(request);
            if (result == null)
                return ResponseUtil.Error<SubmissionResponse>("Failed to save submission", 500);

            return ResponseUtil.Success(result, "Submission saved successfully", 201);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Submission rejected");
            return ResponseUtil.Error<SubmissionResponse>(ex.Message, 403);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving submission");
            return ResponseUtil.Error<SubmissionResponse>("Failed to save submission", 500);
        }
    }

    [HttpPost("force")]
    public async Task<ActionResult<ApiResponse<SubmissionResponse>>> ForceSubmit(
        [FromBody] SubmitProblemRequest request)
    {
        try
        {
            var userId = User.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userId) && !string.Equals(userId, request.StudentId, StringComparison.Ordinal))
                return ResponseUtil.Error<SubmissionResponse>("Student id does not match authenticated user", 403);

            var result = await _submissionCommand.SubmitProblemForceAsync(request);
            if (result == null)
                return ResponseUtil.Error<SubmissionResponse>("Failed to force submit", 500);

            return ResponseUtil.Success(result, "Force submission saved successfully", 201);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error force submitting");
            return ResponseUtil.Error<SubmissionResponse>("Failed to force submit", 500);
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

    [HttpPost("{id}/regrade")]
    public async Task<ActionResult<ApiResponse<AutoGradeSubmissionResult>>> RegradeSubmission(
        string id,
        [FromBody] SingleSubmissionRegradeRequest request)
    {
        try
        {
            var result = await _submissionCommand.RegradeSingleSubmissionAsync(id, request);
            if (!string.IsNullOrEmpty(result.ErrorMessage))
                return ResponseUtil.Error<AutoGradeSubmissionResult>(result.ErrorMessage, 400);
            return ResponseUtil.Success(result, "Re-grading completed", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error re-grading submission {SubmissionId}", id);
            return ResponseUtil.Error<AutoGradeSubmissionResult>("Re-grading failed", 500);
        }
    }

    [HttpPatch("{id}/score")]
    [Authorize(Roles = "LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<bool>>> OverrideSubmissionScore(
        string id,
        [FromBody] SubmissionScoreOverrideRequest request)
    {
        try
        {
            var success = await _submissionCommand.OverrideSubmissionScoreAsync(id, request.FinalScore, request.MaxMark);
            if (!success)
                return ResponseUtil.Error<bool>("Submission not found or update failed", 400);
            return ResponseUtil.Success(success, "Score updated successfully", 200);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Score override validation failed for submission {SubmissionId}", id);
            return ResponseUtil.Error<bool>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error overriding score for submission {SubmissionId}", id);
            return ResponseUtil.Error<bool>("Failed to update score", 500);
        }
    }

    [HttpPost("submit-and-grade")]
    public async Task<ActionResult<ApiResponse<AutoGradeSubmissionResult>>> SubmitAndGradeSubmission(
        [FromBody] SubmitProblemRequest request)
    {
        try
        {
            var userId = User.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userId) && !string.Equals(userId, request.StudentId, StringComparison.Ordinal))
                return ResponseUtil.Error<AutoGradeSubmissionResult>("Student id does not match authenticated user", 403);

            var result = await _submissionCommand.SubmitAndGradeSubmissionAsync(request);
            if (!string.IsNullOrEmpty(result.ErrorMessage) && result.TotalTestCases == 0)
                return ResponseUtil.Error<AutoGradeSubmissionResult>(result.ErrorMessage, 400);

            return ResponseUtil.Success(result, "Submission graded successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting and grading practice submission");
            return ResponseUtil.Error<AutoGradeSubmissionResult>("Failed to submit and grade", 500);
        }
    }
}
