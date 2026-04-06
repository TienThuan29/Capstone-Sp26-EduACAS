using AcasService.Application.Commands.Classroom;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Classroom;

[ApiController]
[Route("api/v1/classrooms")]
[Authorize(Roles = "STUDENT, LECTURER")]
public class RecentlyClassroomCommandController : ControllerBase
{
    private readonly ILogger<RecentlyClassroomCommandController> _logger;
    private readonly IRecordClassroomAccessCommand _recordAccess;

    public RecentlyClassroomCommandController(
        ILogger<RecentlyClassroomCommandController> logger,
        IRecordClassroomAccessCommand recordAccess)
    {
        _logger = logger;
        _recordAccess = recordAccess;
    }

    /// <summary>Records a classroom view for analytics / recently-accessed lists (Redis only).</summary>
    [HttpPost("student/{studentId}/recent-access")]
    public async Task<ActionResult<ApiResponse<object>>> RecordRecentAccess(
        [FromRoute] string studentId,
        [FromBody] RecordClassroomAccessRequest request)
    {
        if (string.IsNullOrWhiteSpace(studentId))
            return ResponseUtil.Error<object>("Student ID is required", 400);
        if (request == null || string.IsNullOrWhiteSpace(request.ClassroomId))
            return ResponseUtil.Error<object>("Classroom ID is required", 400);

        try
        {
            await _recordAccess.RecordAccessAsync(studentId, request.ClassroomId);
            return ResponseUtil.Success(new { recorded = true }, "Recorded classroom access", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record classroom access for student {StudentId}", studentId);
            return ResponseUtil.Error<object>("Internal Server Error", 500);
        }
    }
}
