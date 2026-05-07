using Microsoft.AspNetCore.Mvc;
using AcasService.Application.Queries.QuizStatistics;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;

namespace AcasService.Web.Controllers.Quiz;

[ApiController]
[Route("api/acas/v1/classrooms/{classroomId}/dashboard/quiz-statistics")]
[Authorize]
public class QuizStatisticsQueryController : ControllerBase
{
    private readonly IQuizStatisticsQuery _quizStatisticsQuery;
    private readonly ILogger<QuizStatisticsQueryController> _logger;

    public QuizStatisticsQueryController(
        IQuizStatisticsQuery quizStatisticsQuery,
        ILogger<QuizStatisticsQueryController> logger)
    {
        _quizStatisticsQuery = quizStatisticsQuery;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<QuizScoreStatisticsItem>>>> GetQuizStatistics([FromRoute] string classroomId)
    {
        try
        {
            _logger.LogInformation(
                "Getting quiz statistics for classroom {ClassroomId}",
                classroomId);

            var result = await _quizStatisticsQuery.GetQuizScoreStatisticsAsync(classroomId);

            return ResponseUtil.Success(
                result,
                "Quiz statistics retrieved successfully",
                200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error getting quiz statistics for classroom {ClassroomId}",
                classroomId);

            return ResponseUtil.Error<List<QuizScoreStatisticsItem>>(
                "Failed to retrieve quiz statistics",
                500);
        }
    }
}
