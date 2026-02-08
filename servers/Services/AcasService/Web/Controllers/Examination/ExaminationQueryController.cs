using AcasService.Application.Queries.Examination;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace AcasService.Web.Controllers.Examination;


[ApiController]
[Route("api/v1/examinations")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class ExaminationQueryController : ControllerBase
{
    private readonly ILogger<ExaminationQueryController> _logger;
    private readonly IExaminationQuery _examinationQuery;

    public ExaminationQueryController(
        ILogger<ExaminationQueryController> logger,
        IExaminationQuery examinationQuery)
    {
        _logger = logger;
        _examinationQuery = examinationQuery;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ExaminationResponse>>> GetById(string id)
    {
        try
        {
            var exam = await _examinationQuery.GetByIdAsync(id);
            if (exam == null)
            {
                return ResponseUtil.Error<ExaminationResponse>("Examination not found",404);
            }
            return ResponseUtil.Success(exam,"Examination retrieved successfully",200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving examination by id");
            return ResponseUtil.Error<ExaminationResponse>("Internal Server Error",500);
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ExaminationResponse?>>>> GetAll()
    {
        try
        {
            var exams = await _examinationQuery.GetAllAsync();
            return ResponseUtil.Success(exams,"Examinations retrieved successfully",200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all examinations");
            return ResponseUtil.Error<List<ExaminationResponse?>>("Internal Server Error",500);
        }
    }


    [HttpGet("by-class/{classId}")]
    public async Task<ActionResult<ApiResponse<List<ExaminationResponse?>>>> GetByClassId(string classId)
    {
        try
        {
            var exams = await _examinationQuery.GetByClassIdAsync(classId);
            return ResponseUtil.Success(exams, "Examinations retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving examinations by class id");
            return ResponseUtil.Error<List<ExaminationResponse?>>("Internal Server Error", 500);
        }
    }


    [HttpGet("{examId}/with-problem/{problemId}")]
    public async Task<ActionResult<ApiResponse<ExaminationSpecProblemResponse>>> GetExaminationWithSpecificProblems(
        string examId,
        string problemId
    ) {
        try
        {
            var response = await _examinationQuery.GetExaminationProblemResponseAsync(examId, problemId);
            if (response == null)
            {
                return ResponseUtil.Error<ExaminationSpecProblemResponse>("Examination or problem not found", 404);
            }
            return ResponseUtil.Success(response, "Examination with specific problem retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving examination with specific problem");
            return ResponseUtil.Error<ExaminationSpecProblemResponse>("Internal Server Error", 500);
        }
    }
}