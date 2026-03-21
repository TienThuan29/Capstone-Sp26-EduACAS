using AcasService.Application.Commands.Question;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Question;

[ApiController]
[Route("api/v1/questions")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class QuestionCommandController : ControllerBase
{
    private readonly IQuestionCommand _questionCommand;
    private readonly ILogger<QuestionCommandController> _logger;

    public QuestionCommandController(IQuestionCommand questionCommand, ILogger<QuestionCommandController> logger)
    {
        _questionCommand = questionCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<QuestionResponse>>> CreateQuestion([FromBody] CreateQuestionRequest request)
    {
        try
        {
            var result = await _questionCommand.CreateQuestionAsync(request);
            return ResponseUtil.Success(result, "Question created successfully", 201);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating question");
            return ResponseUtil.Error<QuestionResponse>("Failed to create question", 500);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<QuestionResponse>>> UpdateQuestion(string id, [FromBody] UpdateQuestionRequest request)
    {
        try
        {
            var result = await _questionCommand.UpdateQuestionAsync(id, request);
            return ResponseUtil.Success(result, "Question updated successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuestionResponse>("Question not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating question {Id}", id);
            return ResponseUtil.Error<QuestionResponse>("Failed to update question", 500);
        }
    }

    [HttpPatch("{id}/soft-delete")]
    public async Task<ActionResult<ApiResponse<QuestionResponse>>> SoftDeleteQuestion(string id)
    {
        try
        {
            var result = await _questionCommand.SoftDeleteQuestionAsync(id);
            return ResponseUtil.Success(result, "Question soft deleted successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuestionResponse>("Question not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting question {Id}", id);
            return ResponseUtil.Error<QuestionResponse>("Failed to soft delete question", 500);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<QuestionResponse>>> DeleteQuestion(string id)
    {
        try
        {
            var result = await _questionCommand.DeleteQuestionAsync(id);
            return ResponseUtil.Success(result, "Question deleted successfully", 200);
        }
        catch (KeyNotFoundException)
        {
            return ResponseUtil.Error<QuestionResponse>("Question not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting question {Id}", id);
            return ResponseUtil.Error<QuestionResponse>("Failed to delete question", 500);
        }
    }
}
