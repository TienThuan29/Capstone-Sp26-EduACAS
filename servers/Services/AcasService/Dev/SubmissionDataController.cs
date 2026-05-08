using Microsoft.AspNetCore.Mvc;

namespace AcasService.Dev;

/// <summary>
/// Development-only endpoints for submission-related seed/reset operations.
/// </summary>
[ApiController]
[Route("api/dev")]
public class SubmissionDataController : ControllerBase
{
    private readonly IDynamoDbResetService _resetService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<SubmissionDataController> _logger;

    public SubmissionDataController(
        IDynamoDbResetService resetService,
        IWebHostEnvironment env,
        ILogger<SubmissionDataController> logger)
    {
        _resetService = resetService;
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Wipes and re-seeds submission-related data from seed-data-2.
    /// This entry point is kept separate so submission testing can be triggered independently.
    /// Only available when running in Development environment.
    /// </summary>
    [HttpPost("reset-submission-data")]
    [ProducesResponseType(typeof(ResetDbResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ResetDbResponse>> ResetSubmissionData(CancellationToken cancellationToken)
    {
        if (!_env.IsDevelopment())
        {
            _logger.LogWarning("reset-submission-data was called in non-Development environment; rejecting");
            return StatusCode(403, new ResetDbResponse
            {
                Success = false,
                Message = "This endpoint is only available in Development environment."
            });
        }

        try
        {
            var result = await _resetService.ResetAndSeedSubmissionDataAsync(cancellationToken);
            return Ok(new ResetDbResponse
            {
                Success = result.Success,
                TablesWiped = result.TablesWiped,
                ItemsSeeded = result.ItemsSeeded,
                Message = result.Success
                    ? $"Wiped {result.TablesWiped} tables and seeded {result.ItemsSeeded} items from seed-data-2 for submission-related data."
                    : result.ErrorMessage ?? string.Empty
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "reset-submission-data failed");
            return StatusCode(500, new ResetDbResponse
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}