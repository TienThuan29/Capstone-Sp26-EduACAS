using AcasService.Application.Queries.ProgrammingLanguage;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Mvc;
namespace AcasService.Web.Controllers.ProgrammingLanguage;

[ApiController]
[Route("api/v1/programming-languages")]
public class ProgrammingLanguageQueryController : ControllerBase
{
    private readonly ILogger<ProgrammingLanguageQueryController> _logger;
    private readonly IProgrammingLanguageQuery _programmingLanguageQuery;

    public ProgrammingLanguageQueryController(
        ILogger<ProgrammingLanguageQueryController> logger,
        IProgrammingLanguageQuery programmingLanguageQuery)
    {
        _logger = logger;
        _programmingLanguageQuery = programmingLanguageQuery;
    }

    [HttpGet("enabled")]
    public async Task<ActionResult<ApiResponse<List<ProgrammingLanguageResponse>>>> GetEnabledLanguages()
    {
        try
        {
            var languages = await _programmingLanguageQuery.GetEnabledAsync();
            return ResponseUtil.Success(languages, "Enabled programming languages retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving enabled programming languages");
            return ResponseUtil.Error<List<ProgrammingLanguageResponse>>("Internal Server Error", 500);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProgrammingLanguageResponse>>> GetById(string id)
    {
        try
        {
            var language = await _programmingLanguageQuery.GetByIdAsync(id);
            if (language == null)
            {
                return ResponseUtil.Error<ProgrammingLanguageResponse>("Programming language not found",404);
            }
            return ResponseUtil.Success(language,"Programming language retrieved successfully",200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,"Error retrieving programming language by id: {Id}", id);

            return ResponseUtil.Error<ProgrammingLanguageResponse>("Internal Server Error", 500);
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ProgrammingLanguageResponse>>>> GetAll()
    {
        try
        {
            var languages = await _programmingLanguageQuery.GetAllAsync();
            return ResponseUtil.Success(languages,"Programming languages retrieved successfully",200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,"Error retrieving all programming languages");

            return ResponseUtil.Error<List<ProgrammingLanguageResponse>>("Internal Server Error", 500);
        }
    }

    [HttpGet("paged")]
    public async Task<ActionResult<ApiResponse<PagedProgrammingLanguageResponse>>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool ascending = true)
    {
        try
        {
            var result = await _programmingLanguageQuery.GetPagedAsync(page, pageSize, sortBy, ascending);
            return ResponseUtil.Success(result,"Paged programming languages retrieved successfully",200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,"Error retrieving paged programming languages");

            return ResponseUtil.Error<PagedProgrammingLanguageResponse>("Internal Server Error", 500);
        }
    }
}