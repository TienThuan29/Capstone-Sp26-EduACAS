using AcasService.Application.Commands.ClassEnrollments;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;


namespace AcasService.Web.Controllers.ClassEnrollments;

[ApiController]
[Route("api/v1/class-enrollments")]
[Authorize]
public class ClassEnrollmentsCommandController : ControllerBase
{
    private readonly IClassEnrollmentsCommand _classEnrollmentsCommand;

    private readonly ILogger<ClassEnrollmentsCommandController> _logger;

    public ClassEnrollmentsCommandController(IClassEnrollmentsCommand classEnrollmentsCommand, ILogger<ClassEnrollmentsCommandController> logger)
    {
        _logger = logger;
        _classEnrollmentsCommand = classEnrollmentsCommand;
    }

    [HttpPost("enroll")]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<ApiResponse<ClassEnrollmentsResponse>>> EnrollClass([FromBody] ClassEnrollmentsRequest request)
    {
        try
        {
            var response = await _classEnrollmentsCommand.EnrollClass(request);
            return ResponseUtil.Success(response, "Enrolled in class successfully", 201);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid enrollment key"))
        {
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Invalid enrollment key", 400);
        }
        catch (Exception ex) when (ex.Message.Contains("Student is already enrolled in this class"))
        {
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Student is already enrolled in this class", 409);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Enrollment key does not belong to this class"))
        {
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Enrollment key does not belong to this class", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enrolling in class");
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Internal Server Error", 500);
        }
    }


    [HttpPut("leave")]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<ApiResponse<ClassEnrollmentsResponse>>> LeaveClass([FromBody] ClassEnrollmentsRequest request)
    {
        try
        {
            var response = await _classEnrollmentsCommand.LeaveClass(request);
            return ResponseUtil.Success(response, "Left class successfully", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Student is not enrolled in this class"))
        {
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Student is not enrolled in this class", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving class");
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Internal Server Error", 500);
        }
    }

    [HttpPut("force-leave")]
    [Authorize(Roles = "LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<ClassEnrollmentsResponse>>> ForceLeaveClass(
        [FromQuery] string classId,
        [FromQuery] string studentId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(classId) || string.IsNullOrWhiteSpace(studentId))
            {
                return ResponseUtil.Error<ClassEnrollmentsResponse>("Class ID and Student ID are required", 400);
            }

            var response = await _classEnrollmentsCommand.ForceLeaveClass(classId, studentId);
            return ResponseUtil.Success(response, "Student removed from class successfully", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Student is not enrolled in this class"))
        {
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Student is not enrolled in this class", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing student from class: ClassId={ClassId}, StudentId={StudentId}", classId, studentId);
            return ResponseUtil.Error<ClassEnrollmentsResponse>("Internal Server Error", 500);
        }
    }

}