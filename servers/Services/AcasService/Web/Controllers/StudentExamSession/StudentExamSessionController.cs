using AcasService.Application.Commands.StudentExamSession;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.StudentExamSession;

[ApiController]
[Route("api/v1/student-exam-sessions")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class StudentExamSessionController : ControllerBase
{
    private readonly IStudentExamSessionCommand _command;
    private readonly ILogger<StudentExamSessionController> _logger;

    public StudentExamSessionController(
        IStudentExamSessionCommand command,
        ILogger<StudentExamSessionController> logger)
    {
        _command = command;
        _logger = logger;
    }

    private string? GetJwtUserId() => User.FindFirst("id")?.Value;

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<StudentExamSessionResponse?>>> GetActive()
    {
        var userId = GetJwtUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _command.GetActiveAsync(userId);
        return ResponseUtil.Success(result, result == null ? "No active exam session" : "OK", 200);
    }

    [HttpGet("by-exam/{examId}")]
    public async Task<ActionResult<ApiResponse<StudentExamSessionResponse?>>> GetByExam([FromRoute] string examId)
    {
        var userId = GetJwtUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _command.GetByExamAsync(userId, examId);
        return ResponseUtil.Success(result, result == null ? "No session" : "OK", 200);
    }

    [HttpPost("start")]
    public async Task<ActionResult<ApiResponse<StudentExamSessionResponse>>> Start([FromBody] StudentExamSessionExamIdRequest request)
    {
        var userId = GetJwtUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _command.StartAsync(userId, request.ExamId);
        if (result == null)
            return ResponseUtil.Error<StudentExamSessionResponse>("Cannot start exam session", 400);

        return ResponseUtil.Success(result, "Session started", 200);
    }

    [HttpPost("complete")]
    public async Task<ActionResult<ApiResponse<StudentExamSessionResponse>>> Complete([FromBody] StudentExamSessionExamIdRequest request)
    {
        var userId = GetJwtUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _command.CompleteAsync(userId, request.ExamId);
        if (result == null)
            return ResponseUtil.Error<StudentExamSessionResponse>("Cannot complete session", 400);

        return ResponseUtil.Success(result, "Session completed", 200);
    }

    [HttpPost("lock")]
    public async Task<ActionResult<ApiResponse<StudentExamSessionResponse>>> Lock([FromBody] StudentExamSessionLockRequest request)
    {
        var userId = GetJwtUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _command.LockAsync(userId, request.ExamId, request.LockReason);
        if (result == null)
            return ResponseUtil.Error<StudentExamSessionResponse>("Cannot lock session", 400);

        return ResponseUtil.Success(result, "Session locked", 200);
    }

    [HttpPost("active-problem")]
    public async Task<ActionResult<ApiResponse<StudentExamSessionResponse>>> SetActiveProblem([FromBody] StudentExamSessionSetProblemRequest request)
    {
        var userId = GetJwtUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _command.SetActiveProblemAsync(userId, request.ExamId, request.ProblemId);
        if (result == null)
            return ResponseUtil.Error<StudentExamSessionResponse>("Cannot update active problem", 400);

        return ResponseUtil.Success(result, "Updated", 200);
    }
}
