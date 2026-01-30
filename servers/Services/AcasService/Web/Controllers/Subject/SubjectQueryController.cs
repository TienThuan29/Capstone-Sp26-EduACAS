using AcasService.Application.Queries.Subject;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Subject;

[ApiController]
[Route("api/v1/subjects")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
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

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<SubjectResponse>>>> SearchSubjects(
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isDeleted = null,
        [FromQuery] string? createdBy = null)
    {
        try
        {
            var result = await _subjectQuery.SearchSubjectsAsync(searchTerm, isDeleted, createdBy);
            return ResponseUtil.Success(result, "Search subjects completed successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching subjects");
            return ResponseUtil.Error<List<SubjectResponse>>("Search subjects failed", 500);
        }
    }

    [HttpGet("paged")]
    public async Task<ActionResult<ApiResponse<PagedSubjectResponse>>> GetPagedSubjects(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool ascending = true,
        [FromQuery] bool? includeDeleted = false)
    {
        try
        {
            var result = await _subjectQuery.GetPagedSubjectsAsync(page, pageSize, sortBy, ascending, includeDeleted);
            return ResponseUtil.Success(result, "Paged subjects retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving paged subjects");
            return ResponseUtil.Error<PagedSubjectResponse>("Get paged subjects failed", 500);
        }
    }
}
