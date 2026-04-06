using AcasService.Application.Queries.QuizAttempt;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.QuizAttempt;

[ApiController]
[Route("api/v1/quiz-attempts")]
[Authorize]
public class QuizAttemptQueryController : ControllerBase
{
    private readonly IQuizAttemptQuery _quizAttemptQuery;
    private readonly ILogger<QuizAttemptQueryController> _logger;

    public QuizAttemptQueryController(IQuizAttemptQuery quizAttemptQuery, ILogger<QuizAttemptQueryController> logger)
    {
        _quizAttemptQuery = quizAttemptQuery;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<QuizAttemptResponse>>> GetById(string id)
    {
        try
        {
            var result = await _quizAttemptQuery.GetByIdAsync(id);
            return ResponseUtil.Success(result, "Get quiz attempt successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuizAttemptResponse>("Quiz attempt not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quiz attempt {Id}", id);
            return ResponseUtil.Error<QuizAttemptResponse>("Get quiz attempt failed", 500);
        }
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<List<QuizAttemptResponse>>>> GetByStudentId(string studentId)
    {
        try
        {
            var result = await _quizAttemptQuery.GetByStudentIdAsync(studentId);
            return ResponseUtil.Success(result, "Get student quiz attempts successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quiz attempts for student {StudentId}", studentId);
            return ResponseUtil.Error<List<QuizAttemptResponse>>("Get student quiz attempts failed", 500);
        }
    }
}
