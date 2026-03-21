using AcasService.Application.Commands.ClassroomQuiz;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ClassroomQuiz;

[ApiController]
[Route("api/v1/classroom-quizzes")]
[Authorize]
public class ClassroomQuizCommandController : ControllerBase
{
    private readonly IClassroomQuizCommand _classroomQuizCommand;
    private readonly ILogger<ClassroomQuizCommandController> _logger;

    public ClassroomQuizCommandController(IClassroomQuizCommand classroomQuizCommand, ILogger<ClassroomQuizCommandController> logger)
    {
        _classroomQuizCommand = classroomQuizCommand;
        _logger = logger;
    }

    // TODO: Implement classroom quiz command endpoints (Assign, Update, Delete, etc.)
}
