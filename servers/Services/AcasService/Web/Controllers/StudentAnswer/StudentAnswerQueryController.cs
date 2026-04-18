using AcasService.Application.Queries.StudentAnswer;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.StudentAnswer;

[ApiController]
[Route("api/v1/student-answers")]
[Authorize]
public class StudentAnswerQueryController : ControllerBase
{
    private readonly IStudentAnswerQuery _studentAnswerQuery;
    private readonly ILogger<StudentAnswerQueryController> _logger;

    public StudentAnswerQueryController(IStudentAnswerQuery studentAnswerQuery, ILogger<StudentAnswerQueryController> logger)
    {
        _studentAnswerQuery = studentAnswerQuery;
        _logger = logger;
    }

    [HttpGet("attempt/{attemptId}")]
    public async Task<ActionResult<ApiResponse<List<StudentAnswerResponse>>>> GetByAttemptId(string attemptId)
    {
        try
        {
            var result = await _studentAnswerQuery.GetByAttemptIdAsync(attemptId);
            return ResponseUtil.Success(result, "Get student answers by attempt successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student answers for attempt {AttemptId}", attemptId);
            return ResponseUtil.Error<List<StudentAnswerResponse>>("Get student answers by attempt failed", 500);
        }
    }
}
