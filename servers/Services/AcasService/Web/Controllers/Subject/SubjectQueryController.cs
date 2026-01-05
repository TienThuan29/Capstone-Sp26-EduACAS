using AcasService.Application.Queries;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Subject;

[ApiController]
[Route("api/v1/subjects")]
public class SubjectQueryController : ControllerBase
{
    private readonly ISubjectQuery _subjectQuery;
    private readonly ILogger<SubjectQueryController> _logger;

    public SubjectQueryController(ISubjectQuery subjectQuery, ILogger<SubjectQueryController> logger)
    {
        _subjectQuery = subjectQuery;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SubjectResponse>>>> GetAllSubjects()
    {
        try
        {
            var result = await _subjectQuery.GetAllSubjectsAsync();
            return ResponseUtil.Success(result, "Get all subjects successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all subjects");
            return ResponseUtil.Error<List<SubjectResponse>>("Get all subjects failed", 500);
        }
    }

   
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SubjectResponse>>> GetSubjectById(string id)
    {
        try
        {
            var result = await _subjectQuery.GetSubjectByIdAsync(id);
            return ResponseUtil.Success(result, "Get subject successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Subject not found with id: {Id}", id);
            return ResponseUtil.Error<SubjectResponse>("Subject not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subject by id");
            return ResponseUtil.Error<SubjectResponse>("Get subject failed", 500);
        }
    }
}
