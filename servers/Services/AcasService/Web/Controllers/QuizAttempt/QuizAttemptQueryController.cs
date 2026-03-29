using AcasService.Application.Queries.QuizAttempt;
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
}
