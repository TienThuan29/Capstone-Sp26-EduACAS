using AcasService.Application.Queries.Question;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Question;

[ApiController]
[Route("api/v1/questions")]
[Authorize]
public class QuestionQueryController : ControllerBase
{
    private readonly IQuestionQuery _questionQuery;
    private readonly ILogger<QuestionQueryController> _logger;

    public QuestionQueryController(IQuestionQuery questionQuery, ILogger<QuestionQueryController> logger)
    {
        _questionQuery = questionQuery;
        _logger = logger;
    }

    // TODO: Implement question query endpoints (GetById, GetAll, Search, etc.)
}
