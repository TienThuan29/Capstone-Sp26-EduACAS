using AcasService.Application.Queries.ClassEnrollments;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ClassEnrollments;

[ApiController]
[Route("api/v1/class-enrollments")]
[Authorize]
public class ClassEnrollmentsQueryController : ControllerBase
{
    private readonly IClassEnrollmentsQuery _classEnrollmentsQuery;
    private readonly ILogger<ClassEnrollmentsQueryController> _logger;

    public ClassEnrollmentsQueryController(
        IClassEnrollmentsQuery classEnrollmentsQuery,
        ILogger<ClassEnrollmentsQueryController> logger)
    {
        _classEnrollmentsQuery = classEnrollmentsQuery;
        _logger = logger;
    }

    [HttpGet("classroom/{classId}/students")]
    public async Task<ActionResult<ApiResponse<List<ClassroomStudentResponse>>>> GetStudentsByClassId(
        string classId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(classId))
            {
                return ResponseUtil.Error<List<ClassroomStudentResponse>>("Class ID is required", 400);
            }

            var students = await _classEnrollmentsQuery.GetStudentsByClassIdAsync(classId, cancellationToken);
            return ResponseUtil.Success(students, "Get classroom students successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting students for class {ClassId}", classId);
            return ResponseUtil.Error<List<ClassroomStudentResponse>>("Internal Server Error", 500);
        }
    }
}
