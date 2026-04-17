using AcasService.Application.Queries.StudentExamSession;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.StudentExamSession;

[ApiController]
[Route("api/v1/student-exam-sessions")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class StudentExamSessionQueryController : ControllerBase
{
    private readonly ILogger<StudentExamSessionQueryController> _logger;
    private readonly IStudentExamSessionQuery _query;

    public StudentExamSessionQueryController(
        ILogger<StudentExamSessionQueryController> logger,
        IStudentExamSessionQuery query)
    {
        _logger = logger;
        _query = query;
    }

    [HttpGet("exam/{examId}")]
    public async Task<ActionResult<ApiResponse<List<StudentExamSessionResponse>>>> GetSessionsByExamId([FromRoute] string examId)
    {
        try
        {
            var sessions = await _query.GetSessionsByExamIdAsync(examId);
            return ResponseUtil.Success(sessions, "Get sessions successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching sessions for exam {ExamId}", examId);
            return ResponseUtil.Error<List<StudentExamSessionResponse>>("Internal Server Error", 500);
        }
    }
}
