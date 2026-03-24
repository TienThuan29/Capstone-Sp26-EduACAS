using AcasService.Application.Commands.KeystrokeLogs;
using AcasService.Application.Queries.KeystrokeLogs;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Models;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.KeystrokeLogs;

[ApiController]
[Route("api/v1/keystroke-logs")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class KeystrokeLogsController : ControllerBase
{
    private readonly IKeystrokeLogsCommand _keystrokeLogsCommand;
    private readonly IKeystrokeLogsQuery _keystrokeLogsQuery;
    private readonly ILogger<KeystrokeLogsController> _logger;

    public KeystrokeLogsController(
        IKeystrokeLogsCommand keystrokeLogsCommand,
        IKeystrokeLogsQuery keystrokeLogsQuery,
        ILogger<KeystrokeLogsController> logger)
    {
        _keystrokeLogsCommand = keystrokeLogsCommand;
        _keystrokeLogsQuery = keystrokeLogsQuery;
        _logger = logger;
    }

    [HttpPost("cache")]
    public async Task<ActionResult<ApiResponse<CacheKeystrokeLogsResponse>>> CacheKeystrokeLogs(
        [FromBody] CacheKeystrokeLogsRequest request)
    {
        try
        {
            var response = await _keystrokeLogsCommand.CacheKeystrokeLogsAsync(request).ConfigureAwait(false);
            return ResponseUtil.Success(response, response.Message, 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching keystroke logs");
            return ResponseUtil.Error<CacheKeystrokeLogsResponse>("Failed to cache keystroke logs", 500);
        }
    }

    [HttpPost("flush")]
    public async Task<ActionResult<ApiResponse<FlushKeystrokeLogsResponse>>> FlushKeystrokeLogs(
        [FromBody] FlushKeystrokeLogsRequest request)
    {
        try
        {
            var response = await _keystrokeLogsCommand.FlushKeystrokeLogsAsync(request).ConfigureAwait(false);
            return ResponseUtil.Success(response, response.Message, 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error flushing keystroke logs");
            return ResponseUtil.Error<FlushKeystrokeLogsResponse>("Failed to flush keystroke logs", 500);
        }
    }

    [HttpGet("submission/{submissionId}")]
    public async Task<ActionResult<ApiResponse<List<KeystrokeLog>>>> GetBySubmissionId([FromRoute] string submissionId)
    {
        try
        {
            var logs = await _keystrokeLogsQuery.GetBySubmissionIdAsync(submissionId).ConfigureAwait(false);
            return ResponseUtil.Success(logs, "Keystroke logs retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting keystroke logs for submission {SubmissionId}", submissionId);
            return ResponseUtil.Error<List<KeystrokeLog>>("Failed to get keystroke logs", 500);
        }
    }
}
