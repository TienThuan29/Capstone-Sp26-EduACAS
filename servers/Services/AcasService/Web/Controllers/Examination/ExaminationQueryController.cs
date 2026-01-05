using AcasService.Application.Queries.Examination;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Mvc;


namespace AcasService.Web.Controllers.Examination;


[ApiController]
[Route("api/v1/examinations")]
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
    public async Task<ActionResult<ApiResponse<ExaminationResponseDTO>>> GetById(string id)
    {
        try
        {
            var exam = await _examinationQuery.GetByIdAsync(id);
            if (exam == null)
            {
                return ResponseUtil.Error<ExaminationResponseDTO>("Examination not found",404);
            }
            return ResponseUtil.Success(exam,"Examination retrieved successfully",200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving examination by id");
            return ResponseUtil.Error<ExaminationResponseDTO>("Internal Server Error",500);
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ExaminationResponseDTO?>>>> GetAll()
    {
        try
        {
            var exams = await _examinationQuery.GetAllAsync();
            return ResponseUtil.Success(exams,"Examinations retrieved successfully",200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all examinations");
            return ResponseUtil.Error<List<ExaminationResponseDTO?>>("Internal Server Error",500);
        }
    }
}