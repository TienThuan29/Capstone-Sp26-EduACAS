using AcasService.Application.Commands.Question;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Question;

[ApiController]
[Route("api/v1/questions")]
[Authorize]
public class QuestionCommandController : ControllerBase
{
    private readonly IQuestionCommand _questionCommand;
    private readonly ILogger<QuestionCommandController> _logger;

    public QuestionCommandController(IQuestionCommand questionCommand, ILogger<QuestionCommandController> logger)
    {
        _questionCommand = questionCommand;
        _logger = logger;
    }

    // TODO: Implement question command endpoints (Create, Update, Delete, etc.)
}
