using AcasService.Application.Queries.Quiz;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Quiz;

[ApiController]
[Route("api/v1/quizzes")]
[Authorize]
public class QuizQueryController : ControllerBase
{
    private readonly IQuizQuery _quizQuery;
    private readonly ILogger<QuizQueryController> _logger;

    public QuizQueryController(IQuizQuery quizQuery, ILogger<QuizQueryController> logger)
    {
        _quizQuery = quizQuery;
        _logger = logger;
    }

    // TODO: Implement quiz query endpoints (GetById, GetAll, Search, etc.)
}
