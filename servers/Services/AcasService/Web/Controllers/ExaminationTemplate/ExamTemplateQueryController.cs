using Microsoft.AspNetCore.Mvc;
using AcasService.Application.Queries.ExaminationTemplate;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;

namespace AcasService.Web.Controllers.ExaminationTemplate;

[ApiController]
[Route("api/v1/examination-templates")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class ExamTemplateQueryController : ControllerBase
{
    private readonly ILogger<ExamTemplateQueryController> _logger;
    private readonly IExaminationTemplateQuery _examinationTemplateQuery;

    public ExamTemplateQueryController(
        ILogger<ExamTemplateQueryController> logger,
        IExaminationTemplateQuery examinationTemplateQuery)
    {
        _logger = logger;
        _examinationTemplateQuery = examinationTemplateQuery;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ExaminationTemplateResponse>>> GetById(string id)
    {
        try
        {
            var template = await _examinationTemplateQuery.GetByIdAsync(id);
            if (template == null)
            {
                return ResponseUtil.Error<ExaminationTemplateResponse>("Examination template not found", 404);
            }
            return ResponseUtil.Success(template, "Examination template retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving examination template by id");
            return ResponseUtil.Error<ExaminationTemplateResponse>("Internal Server Error", 500);
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ExaminationTemplateResponse>>>> GetAll(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _examinationTemplateQuery.GetAllAsync(pageIndex, pageSize);
            return ResponseUtil.Success(result, "Examination templates retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all examination templates");
            return ResponseUtil.Error<PagedResult<ExaminationTemplateResponse>>("Internal Server Error", 500);
        }
    }

    [HttpGet("by-lecturer/{lecturerId}")]
    public async Task<ActionResult<ApiResponse<PagedResult<ExaminationTemplateResponse>>>> GetByLecturerId(
        string lecturerId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _examinationTemplateQuery.GetByLecturerIdAsync(lecturerId, pageIndex, pageSize);
            return ResponseUtil.Success(result, "Examination templates retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving examination templates by lecturer id");
            return ResponseUtil.Error<PagedResult<ExaminationTemplateResponse>>("Internal Server Error", 500);
        }
    }
}
