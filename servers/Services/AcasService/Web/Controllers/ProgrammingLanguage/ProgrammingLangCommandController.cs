using AcasService.Application.Commands.ProgrammingLanguage;
using AcasService.Application.Requests.ProgrammingLanguage;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ProgrammingLanguage;

[ApiController]
[Route("api/v1/programming-languages")]
[Authorize(Roles = "ADMIN")]
public class ProgrammingLanguageCommandController : ControllerBase
{
    private readonly ILogger<ProgrammingLanguageCommandController> _logger;
    private readonly IProgrammingLanguageCommand _programmingLanguageCommand;

    public ProgrammingLanguageCommandController(
        ILogger<ProgrammingLanguageCommandController> logger,
        IProgrammingLanguageCommand programmingLanguageCommand)
    {
        _logger = logger;
        _programmingLanguageCommand = programmingLanguageCommand;
    }

    [HttpPost("sync")]
    public async Task<ActionResult<ApiResponse<List<ProgrammingLanguageResponse>>>> SyncProgrammingLanguages()
    {
        try
        {
            var result = await _programmingLanguageCommand.SyncProgrammingLanguagesAsync();
            return ResponseUtil.Success(result, $"Successfully synced {result.Count} programming languages", 200);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error connecting to code-runner service");
            return ResponseUtil.Error<List<ProgrammingLanguageResponse>>("Failed to connect to code-runner service", 503);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing programming languages");
            return ResponseUtil.Error<List<ProgrammingLanguageResponse>>("Internal Server Error", 500);
        }
    }

    // [HttpPost]
    // public async Task<ActionResult<ApiResponse<ProgrammingLanguageResponse>>> Create(
    //     [FromBody] ProgrammingLanguageRequest request)
    // {
    //     try
    //     {
    //         var result = await _programmingLanguageCommand.CreateAsync(request);

    //         return ResponseUtil.Success(result,"Programming language created successfully",201);
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex,"Error creating programming language");

    //         return ResponseUtil.Error<ProgrammingLanguageResponse>("Internal Server Error",500);
    //     }
    // }

    // [HttpPut("{id}")]
    // public async Task<ActionResult<ApiResponse<ProgrammingLanguageResponse>>> Update(
    //     string id,
    //     [FromBody] ProgrammingLanguageRequest request)
    // {
    //     try
    //     {
    //         var result = await _programmingLanguageCommand.UpdateAsync(id, request);

    //         return ResponseUtil.Success(result,"Programming language updated successfully",200);
    //     }
    //     catch (KeyNotFoundException ex)
    //     {
    //         _logger.LogWarning(ex,"Programming language not found: {Id}", id);

    //         return ResponseUtil.Error<ProgrammingLanguageResponse>(ex.Message,404);
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex,"Error updating programming language: {Id}", id);

    //         return ResponseUtil.Error<ProgrammingLanguageResponse>("Internal Server Error",500);
    //     }
    // }

    // [HttpDelete("{id}")]
    // public async Task<ActionResult<ApiResponse<object>>> Delete(string id)
    // {
    //     try
    //     {
    //         await _programmingLanguageCommand.DeleteAsync(id);

    //         return ResponseUtil.Success<object>(null,"Programming language deleted successfully",200);
    //     }
    //     catch (KeyNotFoundException ex)
    //     {
    //         _logger.LogWarning(ex,"Programming language not found: {Id}", id);

    //         return ResponseUtil.Error<object>(ex.Message,404);
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex,"Error deleting programming language: {Id}", id);

    //         return ResponseUtil.Error<object>("Internal Server Error",500);
    //     }
    // }

    // [HttpPatch("{id}/toggle-enable")]
    // public async Task<ActionResult<ApiResponse<ProgrammingLanguageResponse>>> ToggleEnable(string id)
    // {
    //     try
    //     {
    //         var result = await _programmingLanguageCommand.ToggleEnableAsync(id);

    //         return ResponseUtil.Success(result,"Programming language status toggled successfully",200);
    //     }
    //     catch (KeyNotFoundException ex)
    //     {
    //         _logger.LogWarning(ex,"Programming language not found: {Id}", id);

    //         return ResponseUtil.Error<ProgrammingLanguageResponse>(ex.Message,404);
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex,"Error toggling enable status: {Id}", id);

    //         return ResponseUtil.Error<ProgrammingLanguageResponse>("Internal Server Error",500);
    //     }
    // }
}
