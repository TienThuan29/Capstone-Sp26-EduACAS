using AcasService.Application.Commands.Quiz;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Quiz;

[ApiController]
[Route("api/v1/quizzes")]
[Authorize]
public class QuizCommandController : ControllerBase
{
    private readonly IQuizCommand _quizCommand;
    private readonly ILogger<QuizCommandController> _logger;

    public QuizCommandController(IQuizCommand quizCommand, ILogger<QuizCommandController> logger)
    {
        _quizCommand = quizCommand;
        _logger = logger;
    }

    // TODO: Implement quiz command endpoints (Create, Update, Delete, etc.)
}
