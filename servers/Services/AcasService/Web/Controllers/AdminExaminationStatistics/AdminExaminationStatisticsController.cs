using AcasService.Application.Queries.AdminExaminationStatistics;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.AdminExaminationStatistics;

[ApiController]
[Route("api/v1/admin/statistics")]
[Authorize(Roles = "ADMIN")]
public class AdminExaminationStatisticsController : ControllerBase
{
    private readonly ILogger<AdminExaminationStatisticsController> _logger;
    private readonly IAdminExaminationStatisticsQuery _adminStatsQuery;

    public AdminExaminationStatisticsController(
        ILogger<AdminExaminationStatisticsController> logger,
        IAdminExaminationStatisticsQuery adminStatsQuery)
    {
        _logger = logger;
        _adminStatsQuery = adminStatsQuery;
    }

    [HttpGet("examinations")]
    public async Task<ActionResult<ApiResponse<AdminExaminationStatisticsResponse>>> GetExaminationStatistics(
        CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _adminStatsQuery.GetExaminationStatisticsAsync(cancellationToken);
            return ResponseUtil.Success(stats, "Examination statistics retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching examination statistics.");
            return ResponseUtil.Error<AdminExaminationStatisticsResponse>("Failed to retrieve examination statistics", 500);
        }
    }

    [HttpGet("submissions-by-language")]
    public async Task<ActionResult<ApiResponse<SubmissionByLanguageResponse>>> GetSubmissionByLanguage(
        CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _adminStatsQuery.GetSubmissionByLanguageAsync(cancellationToken);
            return ResponseUtil.Success(stats, "Submission by language statistics retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching submission by language statistics.");
            return ResponseUtil.Error<SubmissionByLanguageResponse>("Failed to retrieve submission by language statistics", 500);
        }
    }

    [HttpGet("student-lecturer-ratio")]
    public async Task<ActionResult<ApiResponse<StudentLecturerRatioResponse>>> GetStudentLecturerRatio(
        CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _adminStatsQuery.GetStudentLecturerRatioAsync(cancellationToken);
            return ResponseUtil.Success(stats, "Student lecturer ratio retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching student lecturer ratio.");
            return ResponseUtil.Error<StudentLecturerRatioResponse>("Failed to retrieve student lecturer ratio", 500);
        }
    }

    [HttpGet("users-by-subject")]
    public async Task<ActionResult<ApiResponse<UsersBySubjectResponse>>> GetUsersBySubject(
        CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _adminStatsQuery.GetUsersBySubjectAsync(cancellationToken);
            return ResponseUtil.Success(stats, "Users by subject statistics retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching users by subject statistics.");
            return ResponseUtil.Error<UsersBySubjectResponse>("Failed to retrieve users by subject statistics", 500);
        }
    }
}
