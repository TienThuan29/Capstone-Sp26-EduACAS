using AcasService.Application.Commands.Examination;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Examination;

[ApiController]
[Route("api/v1/academic-warnings")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class AcademicWarningCommandController : ControllerBase
{
    private readonly ILogger<AcademicWarningCommandController> _logger;
    private readonly IAcademicWarningCommand _academicWarningCommand;

    public AcademicWarningCommandController(
        ILogger<AcademicWarningCommandController> logger,
        IAcademicWarningCommand academicWarningCommand)
    {
        _logger = logger;
        _academicWarningCommand = academicWarningCommand;
    }

    // [HttpPost("batch")]
    // public async Task<ActionResult<ApiResponse<SendAcademicWarningResponse>>> SendBatchAcademicWarnings(
    //     [FromBody] SendAcademicWarningBatchRequest request)
    // {
    //     try
    //     {
    //         if (!ModelState.IsValid)
    //             return ResponseUtil.Error<SendAcademicWarningResponse>(
    //                 "Invalid request: " + string.Join("; ",
    //                     ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)),
    //                 400);
    //
    //         var response = await _academicWarningCommand.SendBatchAcademicWarningsAsync(request);
    //         return ResponseUtil.Success(response,
    //             $"Academic warnings processed: {response.ProcessedStudents}/{response.TotalStudents} students",
    //             200);
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "Error sending batch academic warnings for exam {ExamId}", request.ExamId);
    //         return ResponseUtil.Error<SendAcademicWarningResponse>(
    //             "Failed to send academic warnings: " + ex.Message,
    //             500);
    //     }
    // }

    /// <summary>
    /// POST /api/v1/academic-warnings/batch
    /// Accepts the batch request and enqueues background processing via Hangfire.
    /// Returns immediately with 202 Accepted so the lecturer UI is never blocked by
    /// slow Gemini analysis and email sending. Use the returned jobId to track progress.
    /// </summary>
    [HttpPost("batch")]
    public async Task<ActionResult<ApiResponse<BatchAcceptedResponse>>> SendBatchAcademicWarnings(
        [FromBody] SendAcademicWarningBatchRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return ResponseUtil.Error<BatchAcceptedResponse>(
                    "Invalid request: " + string.Join("; ",
                        ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)),
                    400);

            var jobId = await _academicWarningCommand.SendBatchAcademicWarningsAsync_V3(request);
            return ResponseUtil.Success(
                new BatchAcceptedResponse { JobId = jobId },
                $"Academic warning job enqueued. JobId={jobId}. Use GET /academic-warnings/job/{jobId} to track status.",
                202);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enqueuing batch academic warnings for exam {ExamId}", request.ExamId);
            return ResponseUtil.Error<BatchAcceptedResponse>(
                "Failed to enqueue academic warnings: " + ex.Message,
                500);
        }
    }

    /// <summary>
    /// POST /api/v1/academic-warnings/student/{studentId}
    /// Accepts the request and enqueues background processing via Hangfire.
    /// Returns immediately with 202 Accepted.
    /// </summary>
    [HttpPost("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<BatchAcceptedResponse>>> SendSingleAcademicWarning(
        [FromRoute] string studentId,
        [FromBody] SendAcademicWarningRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(studentId))
                return ResponseUtil.Error<BatchAcceptedResponse>("Student ID is required", 400);

            if (!ModelState.IsValid)
                return ResponseUtil.Error<BatchAcceptedResponse>(
                    "Invalid request: " + string.Join("; ",
                        ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)),
                    400);

            var jobId = await _academicWarningCommand.SendSingleAcademicWarningAsync_V3(studentId, request);
            return ResponseUtil.Success(
                new BatchAcceptedResponse { JobId = jobId },
                $"Academic warning job enqueued. JobId={jobId}.",
                202);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enqueuing academic warning for student {StudentId}", studentId);
            return ResponseUtil.Error<BatchAcceptedResponse>(
                "Failed to enqueue academic warning: " + ex.Message,
                500);
        }
    }

    /// <summary>
    /// PATCH /api/v1/academic-warnings/feedback
    /// Saves lecturer feedback and material recommendation for a submission.
    /// Optionally sends a notification to the student if sendFeedbackToStudent is true.
    /// </summary>
    [HttpPatch("feedback")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveLecturerFeedback(
        [FromBody] SaveLecturerFeedbackRequest request,
        [FromQuery] string submissionId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(submissionId))
                return ResponseUtil.Error<bool>("Submission ID is required", 400);

            var success = await _academicWarningCommand.SaveLecturerFeedbackAsync(
                submissionId,
                request.LecturerFeedback ?? string.Empty,
                request.MaterialRecommendation != null
                    ? string.Join(Environment.NewLine, request.MaterialRecommendation)
                    : string.Empty,
                request.SendFeedbackToStudent,
                request.ProblemTitle,
                CancellationToken.None);

            if (!success)
                return ResponseUtil.Error<bool>("Submission not found or update failed", 400);

            return ResponseUtil.Success(success, "Feedback saved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving lecturer feedback for submission {SubmissionId}", submissionId);
            return ResponseUtil.Error<bool>("Failed to save feedback: " + ex.Message, 500);
        }
    }
}
