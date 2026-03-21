using AcasService.Application.Queries.ClassroomQuiz;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ClassroomQuiz;

[ApiController]
[Route("api/v1/classroom-quizzes")]
[Authorize]
public class ClassroomQuizQueryController : ControllerBase
{
    private readonly IClassroomQuizQuery _classroomQuizQuery;
    private readonly ILogger<ClassroomQuizQueryController> _logger;

    public ClassroomQuizQueryController(IClassroomQuizQuery classroomQuizQuery, ILogger<ClassroomQuizQueryController> logger)
    {
        _classroomQuizQuery = classroomQuizQuery;
        _logger = logger;
    }

    // TODO: Implement classroom quiz query endpoints (GetByClassroom, GetById, etc.)
}
