using AcasService.Application.Queries.ClassroomQuiz;
using AcasService.Application.ResponseDTOs;
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

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ClassroomQuizResponse>>> GetClassroomQuizById(string id)
    {
        try
        {
            var result = await _classroomQuizQuery.GetClassroomQuizByIdAsync(id);
            if (result == null)
            {
                _logger.LogWarning($"Classroom quiz assignment {id} not found.");
                return ResponseUtil.Error<ClassroomQuizResponse>("Classroom quiz assignment not found", 404);
            }
            return ResponseUtil.Success(result, "Get classroom quiz assignment successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching classroom quiz assignment {id}");
            return ResponseUtil.Error<ClassroomQuizResponse>("Failed to fetch classroom quiz assignment", 500);
        }
    }

    [HttpGet("classroom/{classroomId}")]
    public async Task<ActionResult<ApiResponse<List<ClassroomQuizResponse>>>> GetClassroomQuizzesByClassroom(string classroomId)
    {
        try
        {
            var result = await _classroomQuizQuery.GetClassroomQuizzesByClassroomIdAsync(classroomId);
            return ResponseUtil.Success(result, "Get classroom quizzes for classroom successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching classroom quizzes for classroom {classroomId}");
            return ResponseUtil.Error<List<ClassroomQuizResponse>>("Failed to fetch classroom quizzes", 500);
        }
    }

    [HttpGet("classroom/{classroomId}/paged")]
    public async Task<ActionResult<ApiResponse<PagedResult<ClassroomQuizResponse>>>> GetClassroomQuizzesByClassroomPaged(
        string classroomId, 
        [FromQuery] int pageIndex = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] bool includeDrafts = false)
    {
        try
        {
            var result = await _classroomQuizQuery.GetClassroomQuizzesByClassroomIdPagedAsync(classroomId, pageIndex, pageSize, includeDrafts);
            return ResponseUtil.Success(result, "Get paged classroom quizzes successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching paged classroom quizzes for classroom {classroomId}");
            return ResponseUtil.Error<PagedResult<ClassroomQuizResponse>>("Failed to fetch paged classroom quizzes", 500);
        }
    }
}
