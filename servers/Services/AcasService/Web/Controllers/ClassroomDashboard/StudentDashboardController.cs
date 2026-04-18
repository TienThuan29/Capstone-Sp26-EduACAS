using AcasService.Application.Queries.ClassroomDashboard;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ClassroomDashboard;

[ApiController]
[Route("api/v1/classrooms")]
public class StudentDashboardController : ControllerBase
{
    private readonly IStudentDashboardQuery _studentDashboardQuery;
    private readonly ILogger<StudentDashboardController> _logger;

    public StudentDashboardController(
        IStudentDashboardQuery studentDashboardQuery,
        ILogger<StudentDashboardController> logger)
    {
        _studentDashboardQuery = studentDashboardQuery;
        _logger = logger;
    }

    /// <summary>
    /// Get student dashboard overview for a specific classroom
    /// </summary>
    [HttpGet("{classroomId}/student-dashboard/overview")]
    public async Task<ActionResult<ApiResponse<StudentDashboardOverviewItem>>> GetOverview(
        [FromRoute] string classroomId,
        [FromQuery] string studentId)
    {
        try
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return ResponseUtil.Error<StudentDashboardOverviewItem>("Student ID is required", 400);
            }

            var result = await _studentDashboardQuery.GetOverviewAsync(classroomId, studentId);
            if (result == null)
            {
                return ResponseUtil.Error<StudentDashboardOverviewItem>("Enrollment not found", 404);
            }

            return ResponseUtil.Success(result, "Overview retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student overview for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<StudentDashboardOverviewItem>("Failed to get overview", 500);
        }
    }

    /// <summary>
    /// Get all exam scores for current student in a classroom
    /// </summary>
    [HttpGet("{classroomId}/student-dashboard/exam-scores")]
    public async Task<ActionResult<ApiResponse<List<StudentExamScoreItem>>>> GetExamScores(
        [FromRoute] string classroomId,
        [FromQuery] string studentId)
    {
        try
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return ResponseUtil.Error<List<StudentExamScoreItem>>("Student ID is required", 400);
            }

            var result = await _studentDashboardQuery.GetExamScoresAsync(classroomId, studentId);
            return ResponseUtil.Success(result, "Exam scores retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting exam scores for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<List<StudentExamScoreItem>>("Failed to get exam scores", 500);
        }
    }

    /// <summary>
    /// Get all academic warnings for current student
    /// </summary>
    [HttpGet("{classroomId}/student-dashboard/warnings")]
    public async Task<ActionResult<ApiResponse<List<StudentWarningItem>>>> GetWarnings(
        [FromRoute] string classroomId,
        [FromQuery] string studentId,
        [FromQuery] int limit = 10)
    {
        try
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return ResponseUtil.Error<List<StudentWarningItem>>("Student ID is required", 400);
            }

            var result = await _studentDashboardQuery.GetWarningsAsync(studentId, limit);
            return ResponseUtil.Success(result, "Warnings retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting warnings for student");
            return ResponseUtil.Error<List<StudentWarningItem>>("Failed to get warnings", 500);
        }
    }

    /// <summary>
    /// Get score trend (chart data) for current student
    /// </summary>
    [HttpGet("{classroomId}/student-dashboard/score-trend")]
    public async Task<ActionResult<ApiResponse<List<StudentScoreTrendItem>>>> GetScoreTrend(
        [FromRoute] string classroomId,
        [FromQuery] string studentId)
    {
        try
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return ResponseUtil.Error<List<StudentScoreTrendItem>>("Student ID is required", 400);
            }

            var result = await _studentDashboardQuery.GetScoreTrendAsync(classroomId, studentId);
            return ResponseUtil.Success(result, "Score trend retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting score trend for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<List<StudentScoreTrendItem>>("Failed to get score trend", 500);
        }
    }

    /// <summary>
    /// Get submission statistics for current student
    /// </summary>
    [HttpGet("{classroomId}/student-dashboard/submission-stats")]
    public async Task<ActionResult<ApiResponse<StudentSubmissionStatsItem>>> GetSubmissionStats(
        [FromRoute] string classroomId,
        [FromQuery] string studentId)
    {
        try
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return ResponseUtil.Error<StudentSubmissionStatsItem>("Student ID is required", 400);
            }

            var result = await _studentDashboardQuery.GetSubmissionStatsAsync(classroomId, studentId);
            if (result == null)
            {
                return ResponseUtil.Error<StudentSubmissionStatsItem>("Enrollment not found", 404);
            }

            return ResponseUtil.Success(result, "Submission stats retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting submission stats for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<StudentSubmissionStatsItem>("Failed to get submission stats", 500);
        }
    }
}