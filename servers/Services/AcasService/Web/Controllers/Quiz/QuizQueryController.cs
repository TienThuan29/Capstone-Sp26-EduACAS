using AcasService.Application.Queries.Quiz;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Quiz;

[ApiController]
[Route("api/v1/quizzes")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class QuizQueryController : ControllerBase
{
    private readonly IQuizQuery _quizQuery;
    private readonly ILogger<QuizQueryController> _logger;

    public QuizQueryController(IQuizQuery quizQuery, ILogger<QuizQueryController> logger)
    {
        _quizQuery = quizQuery;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<QuizResponse>>>> GetAllQuizzes([FromQuery] bool includeDeleted = false)
    {
        try
        {
            var result = await _quizQuery.GetAllQuizzesAsync(includeDeleted);
            return ResponseUtil.Success(result, "Get all quizzes successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quizzes");
            return ResponseUtil.Error<List<QuizResponse>>("Get all quizzes failed", 500);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<QuizResponse>>> GetQuizById(string id)
    {
        try
        {
            var result = await _quizQuery.GetQuizByIdAsync(id);
            return ResponseUtil.Success(result, "Get quiz successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuizResponse>("Quiz not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quiz {Id}", id);
            return ResponseUtil.Error<QuizResponse>("Get quiz failed", 500);
        }
    }
}
