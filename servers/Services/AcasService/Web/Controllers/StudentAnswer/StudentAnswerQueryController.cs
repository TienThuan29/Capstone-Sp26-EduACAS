using AcasService.Application.Queries.StudentAnswer;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.StudentAnswer;

[ApiController]
[Route("api/v1/student-answers")]
[Authorize]
public class StudentAnswerQueryController : ControllerBase
{
    private readonly IStudentAnswerQuery _studentAnswerQuery;
    private readonly ILogger<StudentAnswerQueryController> _logger;

    public StudentAnswerQueryController(IStudentAnswerQuery studentAnswerQuery, ILogger<StudentAnswerQueryController> logger)
    {
        _studentAnswerQuery = studentAnswerQuery;
        _logger = logger;
    }

    // TODO: Implement student answer query endpoints (GetByAttempt, GetById, etc.)
}
