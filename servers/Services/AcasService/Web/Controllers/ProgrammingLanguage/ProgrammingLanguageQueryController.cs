

using AcasService.Application.Queries.ProgrammingLanguage;
using AcasService.Application.Responses.ProgrammingLanguage;
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
}