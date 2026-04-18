using AcasService.Application.Commands.QuizAttempt;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.QuizAttempt;

[ApiController]
[Route("api/v1/quiz-attempts")]
[Authorize]
public class QuizAttemptCommandController : ControllerBase
{
    private readonly IQuizAttemptCommand _quizAttemptCommand;
    private readonly ILogger<QuizAttemptCommandController> _logger;

    public QuizAttemptCommandController(IQuizAttemptCommand quizAttemptCommand, ILogger<QuizAttemptCommandController> logger)
    {
        _quizAttemptCommand = quizAttemptCommand;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<ActionResult<ApiResponse<QuizAttemptResponse>>> StartAttempt([FromBody] StartQuizAttemptRequest request)
    {
        try
        {
            var result = await _quizAttemptCommand.StartAttemptAsync(request);
            return ResponseUtil.Success(result, "Quiz attempt started successfully", 201);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, $"Classroom quiz {request.ClassroomQuizId} not found");
            return ResponseUtil.Error<QuizAttemptResponse>("Quiz not found", 404);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error starting quiz attempt");
            return ResponseUtil.Error<QuizAttemptResponse>(ex.Message, 400);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, $"Invalid start attempt for student {request.StudentId} and quiz {request.ClassroomQuizId}");
            return ResponseUtil.Error<QuizAttemptResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting quiz attempt");
            return ResponseUtil.Error<QuizAttemptResponse>("Failed to start quiz attempt", 500);
        }
    }

    [HttpPost("{id}/answers")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateAnswer(string id, [FromBody] UpdateQuizAnswerRequest request)
    {
        try
        {
            await _quizAttemptCommand.UpdateAnswerAsync(id, request);
            return ResponseUtil.Success(true, "Answer updated successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, $"Quiz attempt {id} not found for updating answer");
            return ResponseUtil.Error<bool>("Quiz attempt not found", 404);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, $"Invalid answer update for attempt {id}");
            return ResponseUtil.Error<bool>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating answer for attempt {id}");
            return ResponseUtil.Error<bool>("Failed to update answer", 500);
        }
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ApiResponse<QuizAttemptResponse>>> Submit(string id)
    {
        try
        {
            var result = await _quizAttemptCommand.SubmitAttemptAsync(id);
            return ResponseUtil.Success(result, "Quiz submitted successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, $"Quiz attempt {id} not found for submission");
            return ResponseUtil.Error<QuizAttemptResponse>("Quiz attempt not found", 404);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, $"Invalid submission for attempt {id}");
            return ResponseUtil.Error<QuizAttemptResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error submitting quiz attempt {id}");
            return ResponseUtil.Error<QuizAttemptResponse>("Failed to submit quiz attempt", 500);
        }
    }
}
