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

    [HttpPost("batch")]
    public async Task<ActionResult<ApiResponse<SendAcademicWarningResponse>>> SendBatchAcademicWarnings(
        [FromBody] SendAcademicWarningBatchRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return ResponseUtil.Error<SendAcademicWarningResponse>(
                    "Invalid request: " + string.Join("; ",
                        ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)),
                    400);

            var response = await _academicWarningCommand.SendBatchAcademicWarningsAsync(request);
            return ResponseUtil.Success(response,
                $"Academic warnings processed: {response.ProcessedStudents}/{response.TotalStudents} students",
                200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending batch academic warnings for exam {ExamId}", request.ExamId);
            return ResponseUtil.Error<SendAcademicWarningResponse>(
                "Failed to send academic warnings: " + ex.Message,
                500);
        }
    }

    [HttpPost("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<SendAcademicWarningResponse>>> SendSingleAcademicWarning(
        [FromRoute] string studentId,
        [FromBody] SendAcademicWarningRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(studentId))
                return ResponseUtil.Error<SendAcademicWarningResponse>("Student ID is required", 400);

            if (!ModelState.IsValid)
                return ResponseUtil.Error<SendAcademicWarningResponse>(
                    "Invalid request: " + string.Join("; ",
                        ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)),
                    400);

            var response = await _academicWarningCommand.SendSingleAcademicWarningAsync(studentId, request);
            return ResponseUtil.Success(response,
                $"Academic warning sent: {response.ProcessedStudents}/{response.TotalStudents}",
                200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending academic warning for student {StudentId}", studentId);
            return ResponseUtil.Error<SendAcademicWarningResponse>(
                "Failed to send academic warning: " + ex.Message,
                500);
        }
    }
}
