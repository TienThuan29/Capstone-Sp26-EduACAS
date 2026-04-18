using AcasService.Application.Commands.Formatters;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Formatters;

[ApiController]
[Route("api/v1/format")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class CodeFormatterCommandController : ControllerBase
{
    private readonly ICodeFormatterCommand _codeFormatterCommand;
    private readonly ILogger<CodeFormatterCommandController> _logger;

    public CodeFormatterCommandController(
        ICodeFormatterCommand codeFormatterCommand,
        ILogger<CodeFormatterCommandController> logger)
    {
        _codeFormatterCommand = codeFormatterCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<FormatCodeResponse>>> FormatCode(
        [FromQuery] string lang,
        [FromBody] FormatCodeRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(lang))
            {
                return ResponseUtil.Error<FormatCodeResponse>(
                    "Language parameter is required",
                    statusCode: 400);
            }

            var result = await _codeFormatterCommand.FormatCodeAsync(lang, request);

            if (result.Code != 0)
            {
                return ResponseUtil.Error<FormatCodeResponse>(
                    result.Stderr ?? "Code formatting failed",
                    statusCode: 400);
            }

            return ResponseUtil.Success(result, "Code formatted successfully", 200);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument for code formatting");
            return ResponseUtil.Error<FormatCodeResponse>(ex.Message, 400);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error calling code-runner format service");
            return ResponseUtil.Error<FormatCodeResponse>(
                "Failed to connect to code formatting service",
                error: ex.Message,
                statusCode: 503);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error formatting code");
            return ResponseUtil.Error<FormatCodeResponse>(
                "Internal Server Error",
                error: ex.Message,
                statusCode: 500);
        }
    }
}
