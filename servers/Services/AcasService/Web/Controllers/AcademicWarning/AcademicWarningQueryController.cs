using AcasService.Application.Queries.AcademicWarning;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.AcademicWarning;

[ApiController]
[Route("api/v1/academic-warnings")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class AcademicWarningQueryController : ControllerBase
{
    private readonly ILogger<AcademicWarningQueryController> _logger;
    private readonly IAcademicWarningQuery _query;

    public AcademicWarningQueryController(
        ILogger<AcademicWarningQueryController> logger,
        IAcademicWarningQuery query)
    {
        _logger = logger;
        _query = query;
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<List<AcademicWarningResponse>>>> GetByStudentId(
        [FromRoute] string studentId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(studentId))
                return ResponseUtil.Error<List<AcademicWarningResponse>>("Student ID is required", 400);

            var warnings = await _query.GetByStudentIdAsync(studentId);
            return ResponseUtil.Success(warnings, "Academic warnings retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warnings for student {StudentId}", studentId);
            return ResponseUtil.Error<List<AcademicWarningResponse>>(
                "Failed to retrieve academic warnings.",
                500,
                error: ex.Message,
                stack: ex.StackTrace);
        }
    }

    [HttpGet("classroom/{classroomId}")]
    public async Task<ActionResult<ApiResponse<List<AcademicWarningResponse>>>> GetByClassroomId(
        [FromRoute] string classroomId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(classroomId))
                return ResponseUtil.Error<List<AcademicWarningResponse>>("Classroom ID is required", 400);

            var warnings = await _query.GetByClassroomIdAsync(classroomId);
            return ResponseUtil.Success(warnings, "Academic warnings retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warnings for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<List<AcademicWarningResponse>>(
                "Failed to retrieve academic warnings.",
                500,
                error: ex.Message,
                stack: ex.StackTrace);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AcademicWarningResponse>>> GetById([FromRoute] string id)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(id))
                return ResponseUtil.Error<AcademicWarningResponse>("Academic warning ID is required", 400);

            var warning = await _query.GetByIdAsync(id);
            if (warning == null)
                return ResponseUtil.Error<AcademicWarningResponse>("Academic warning not found", 404);

            return ResponseUtil.Success(warning, "Academic warning retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warning {Id}", id);
            return ResponseUtil.Error<AcademicWarningResponse>(
                "Failed to retrieve academic warning.",
                500,
                error: ex.Message,
                stack: ex.StackTrace);
        }
    }
}
