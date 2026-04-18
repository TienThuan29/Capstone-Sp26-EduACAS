using AcasService.Application.Queries.ClassroomDashboard;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ClassroomDashboard;

[ApiController]
[Route("api/v1/classrooms")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class ClassroomDashboardController : ControllerBase
{
    private readonly IClassroomDashboardQuery _classroomDashboardQuery;
    private readonly ILogger<ClassroomDashboardController> _logger;

    public ClassroomDashboardController(
        IClassroomDashboardQuery classroomDashboardQuery,
        ILogger<ClassroomDashboardController> logger)
    {
        _classroomDashboardQuery = classroomDashboardQuery;
        _logger = logger;
    }

    /// <summary>
    /// Get score distribution for a specific classroom
    /// </summary>
    [HttpGet("{classroomId}/dashboard/score-distribution")]
    public async Task<ActionResult<ApiResponse<List<ScoreDistributionItem>>>> GetScoreDistribution(
        [FromRoute] string classroomId,
        [FromQuery] string? mode = null)
    {
        try
        {
            var result = await _classroomDashboardQuery.GetScoreDistributionAsync(classroomId, mode);
            return ResponseUtil.Success(result, "Score distribution retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting score distribution for classroom {ClassroomId} with mode {Mode}", classroomId, mode);
            return ResponseUtil.Error<List<ScoreDistributionItem>>("Failed to get score distribution", 500);
        }
    }

    /// <summary>
    /// Get at-risk students for a specific classroom
    /// </summary>
    [HttpGet("{classroomId}/dashboard/at-risk")]
    public async Task<ActionResult<ApiResponse<List<AtRiskStudentItem>>>> GetAtRiskStudents(
        [FromRoute] string classroomId,
        [FromQuery] int limit = 10)
    {
        try
        {
            var result = await _classroomDashboardQuery.GetAtRiskStudentsAsync(classroomId, limit);
            return ResponseUtil.Success(result, "At-risk students retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting at-risk students for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<List<AtRiskStudentItem>>("Failed to get at-risk students", 500);
        }
    }

    /// <summary>
    /// Get recent academic warnings for a specific classroom
    /// </summary>
    [HttpGet("{classroomId}/dashboard/warnings")]
    public async Task<ActionResult<ApiResponse<List<RecentWarningItem>>>> GetWarnings(
        [FromRoute] string classroomId,
        [FromQuery] int limit = 10,
        [FromQuery] string? sortBy = "sentDate",
        [FromQuery] string? sortOrder = "desc")
    {
        try
        {
            var result = await _classroomDashboardQuery.GetRecentWarningsAsync(classroomId, limit);
            return ResponseUtil.Success(result, "Recent warnings retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting warnings for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<List<RecentWarningItem>>("Failed to get warnings", 500);
        }
    }

    /// <summary>
    /// Get stats for all classrooms or a specific classroom
    /// </summary>
    [HttpGet("dashboard/stats")]
    public async Task<ActionResult<ApiResponse<List<ClassStatsItem>>>> GetClassStats(
        [FromQuery] string? classroomId = null)
    {
        try
        {
            var result = await _classroomDashboardQuery.GetClassStatsAsync(classroomId);
            return ResponseUtil.Success(result, "Class stats retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting class stats");
            return ResponseUtil.Error<List<ClassStatsItem>>("Failed to get class stats", 500);
        }
    }

    /// <summary>
    /// Get score statistics for exams in a specific classroom
    /// </summary>
    [HttpGet("{classroomId}/dashboard/exam-statistics")]
    public async Task<ActionResult<ApiResponse<List<ExamScoreStatisticsItem>>>> GetExamScoreStatistics(
        [FromRoute] string classroomId,
        [FromQuery] string? examId = null)
    {
        try
        {
            var result = await _classroomDashboardQuery.GetExamScoreStatisticsAsync(classroomId, examId);
            return ResponseUtil.Success(result, "Exam score statistics retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting exam score statistics for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<List<ExamScoreStatisticsItem>>("Failed to get exam score statistics", 500);
        }
    }
}
