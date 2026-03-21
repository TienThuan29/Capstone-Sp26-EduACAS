using AcasService.Application.Commands.QuizAttempt;
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

    // TODO: Implement quiz attempt command endpoints (Start, Submit, Abandon, etc.)
}
