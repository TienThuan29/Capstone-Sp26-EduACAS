using AcasService.Application.Commands.QuizAttempt;
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
    private readonly IQuizAttemptCommand _quizAttemptCommand;
    private readonly ILogger<QuizAttemptQueryController> _logger;

    public QuizAttemptQueryController(IQuizAttemptCommand quizAttemptCommand, ILogger<QuizAttemptQueryController> logger)
    {
        _quizAttemptCommand = quizAttemptCommand;
        _logger = logger;
    }

    [HttpGet("history/classroom-quiz/{classroomQuizId}/student/{studentId}")]
    public async Task<ActionResult<ApiResponse<List<QuizAttemptResponse>>>> GetHistory(string classroomQuizId, string studentId)
    {
        try
        {
            var result = await _quizAttemptCommand.GetHistoryAsync(classroomQuizId, studentId);
            if (result == null || result.Count == 0)
            {
                return ResponseUtil.Error<List<QuizAttemptResponse>>("No history found", 404);
            }
            return ResponseUtil.Success(result, "Quiz history retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving quiz history for quiz {classroomQuizId} student {studentId}");
            return ResponseUtil.Error<List<QuizAttemptResponse>>("Failed to retrieve quiz history", 500);
        }
    }

    [HttpGet("submissions/classroom-quiz/{classroomQuizId}")]
    public async Task<ActionResult<ApiResponse<PagedResult<QuizAttemptResponse>>>> GetSubmissions(
        string classroomQuizId, 
        [FromQuery] int pageIndex = 1, 
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _quizAttemptCommand.GetPagedSubmissionsAsync(classroomQuizId, pageIndex, pageSize);
            return ResponseUtil.Success(result, "Quiz submissions retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving quiz submissions for quiz {classroomQuizId}");
            return ResponseUtil.Error<PagedResult<QuizAttemptResponse>>("Failed to retrieve quiz submissions", 500);
        }
    }
}
