using AcasService.Application.Commands.StudentAnswer;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.StudentAnswer;

[ApiController]
[Route("api/v1/student-answers")]
[Authorize]
public class StudentAnswerCommandController : ControllerBase
{
    private readonly IStudentAnswerCommand _studentAnswerCommand;
    private readonly ILogger<StudentAnswerCommandController> _logger;

    public StudentAnswerCommandController(IStudentAnswerCommand studentAnswerCommand, ILogger<StudentAnswerCommandController> logger)
    {
        _studentAnswerCommand = studentAnswerCommand;
        _logger = logger;
    }

    // TODO: Implement student answer command endpoints (SubmitAnswer, UpdateAnswer, etc.)
}
