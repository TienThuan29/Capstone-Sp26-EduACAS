using AcasService.Application.Queries.Question;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Question;

[ApiController]
[Route("api/v1/questions")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class QuestionQueryController : ControllerBase
{
    private readonly IQuestionQuery _questionQuery;
    private readonly ILogger<QuestionQueryController> _logger;

    public QuestionQueryController(IQuestionQuery questionQuery, ILogger<QuestionQueryController> logger)
    {
        _questionQuery = questionQuery;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<QuestionResponse>>>> GetAllQuestions([FromQuery] bool includeDeleted = false)
    {
        try
        {
            var result = await _questionQuery.GetAllQuestionsAsync(includeDeleted);
            return ResponseUtil.Success(result, "Get all questions successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting questions");
            return ResponseUtil.Error<List<QuestionResponse>>("Get all questions failed", 500);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<QuestionResponse>>> GetQuestionById(string id)
    {
        try
        {
            var result = await _questionQuery.GetQuestionByIdAsync(id);
            return ResponseUtil.Success(result, "Get question successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuestionResponse>("Question not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting question {Id}", id);
            return ResponseUtil.Error<QuestionResponse>("Get question failed", 500);
        }
    }
}
