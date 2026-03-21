using AcasService.Application.Commands.Quiz;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Quiz;

[ApiController]
[Route("api/v1/quizzes")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class QuizCommandController : ControllerBase
{
    private readonly IQuizCommand _quizCommand;
    private readonly ILogger<QuizCommandController> _logger;

    public QuizCommandController(IQuizCommand quizCommand, ILogger<QuizCommandController> logger)
    {
        _quizCommand = quizCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<QuizResponse>>> CreateQuiz([FromBody] CreateQuizRequest request)
    {
        try
        {
            var result = await _quizCommand.CreateQuizAsync(request);
            return ResponseUtil.Success(result, "Quiz created successfully", 201);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating quiz");
            return ResponseUtil.Error<QuizResponse>("Failed to create quiz", 500);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<QuizResponse>>> UpdateQuiz(string id, [FromBody] UpdateQuizRequest request)
    {
        try
        {
            var result = await _quizCommand.UpdateQuizAsync(id, request);
            return ResponseUtil.Success(result, "Quiz updated successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuizResponse>("Quiz not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quiz {Id}", id);
            return ResponseUtil.Error<QuizResponse>("Failed to update quiz", 500);
        }
    }

    [HttpPatch("{id}/soft-delete")]
    public async Task<ActionResult<ApiResponse<QuizResponse>>> SoftDeleteQuiz(string id)
    {
        try
        {
            var result = await _quizCommand.SoftDeleteQuizAsync(id);
            return ResponseUtil.Success(result, "Quiz soft deleted successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuizResponse>("Quiz not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting quiz {Id}", id);
            return ResponseUtil.Error<QuizResponse>("Failed to soft delete quiz", 500);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<QuizResponse>>> DeleteQuiz(string id)
    {
        try
        {
            var result = await _quizCommand.DeleteQuizAsync(id);
            return ResponseUtil.Success(result, "Quiz deleted successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuizResponse>("Quiz not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting quiz {Id}", id);
            return ResponseUtil.Error<QuizResponse>("Failed to delete quiz", 500);
        }
    }
}
