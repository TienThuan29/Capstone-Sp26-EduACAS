using Microsoft.AspNetCore.Mvc;

namespace AcasService.Dev;

/// <summary>
/// Development-only endpoints for quiz data reset and seeding.
/// </summary>
[ApiController]
[Route("api/dev")]
public class QuizDataController : ControllerBase
{
    private readonly IDynamoDbResetService _resetService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<QuizDataController> _logger;

    public QuizDataController(
        IDynamoDbResetService resetService,
        IWebHostEnvironment env,
        ILogger<QuizDataController> logger)
    {
        _resetService = resetService;
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Wipes and re-seeds quiz-related data from seed-data-2, including Question,
    /// AnswerOption, Quiz, ClassroomQuiz, QuizAttempt, and StudentAnswer.
    /// Only available when running in Development environment.
    /// </summary>
    [HttpPost("reset-quiz-data")]
    [ProducesResponseType(typeof(ResetDbResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ResetDbResponse>> ResetQuizData(CancellationToken cancellationToken)
    {
        if (!_env.IsDevelopment())
        {
            _logger.LogWarning("reset-quiz-data was called in non-Development environment; rejecting");
            return StatusCode(403, new ResetDbResponse
            {
                Success = false,
                Message = "This endpoint is only available in Development environment."
            });
        }

        try
        {
            var result = await _resetService.ResetAndSeedQuizDataAsync(cancellationToken);
            return Ok(new ResetDbResponse
            {
                Success = result.Success,
                TablesWiped = result.TablesWiped,
                ItemsSeeded = result.ItemsSeeded,
                Message = result.Success
                    ? $"Wiped {result.TablesWiped} quiz-related tables and seeded {result.ItemsSeeded} items from seed-data-2."
                    : result.ErrorMessage ?? string.Empty
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "reset-quiz-data failed");
            return StatusCode(500, new ResetDbResponse
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Seeds rich quiz data (questions, quizzes, classroom quizzes, quiz attempts)
    /// for Introduction to Programming class (cls-001) without wiping existing data.
    /// Creates realistic data for dashboard visualization including multi-attempt students.
    /// Only available when running in Development environment.
    /// </summary>
    [HttpPost("seed-cls001-quiz-data")]
    [ProducesResponseType(typeof(ResetDbResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ResetDbResponse>> SeedCls001QuizData(CancellationToken cancellationToken)
    {
        if (!_env.IsDevelopment())
        {
            _logger.LogWarning("seed-cls001-quiz-data was called in non-Development environment; rejecting");
            return StatusCode(403, new ResetDbResponse
            {
                Success = false,
                Message = "This endpoint is only available in Development environment."
            });
        }

        try
        {
            var result = await _resetService.SeedCls001QuizDataAsync(cancellationToken);
            return Ok(new ResetDbResponse
            {
                Success = result.Success,
                TablesWiped = result.TablesWiped,
                ItemsSeeded = result.ItemsSeeded,
                Message = result.Success
                    ? $"Seeded {result.ItemsSeeded} quiz items for cls-001 (Introduction to Programming)."
                    : result.ErrorMessage ?? string.Empty
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "seed-cls001-quiz-data failed");
            return StatusCode(500, new ResetDbResponse
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}