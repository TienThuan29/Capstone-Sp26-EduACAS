using Microsoft.AspNetCore.Mvc;

namespace AcasService.Dev;

/// <summary>
/// Development-only endpoints. All actions are disabled when not running in Development environment.
/// </summary>
[ApiController]
[Route("api/dev")]
public class DeveloperController : ControllerBase
{
    private readonly IDynamoDbResetService _resetService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<DeveloperController> _logger;

    public DeveloperController(
        IDynamoDbResetService resetService,
        IWebHostEnvironment env,
        ILogger<DeveloperController> logger)
    {
        _resetService = resetService;
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Wipes all discovered DynamoDB tables and re-seeds them with realistic mock data.
    /// Only available when running in Development environment.
    /// </summary>
    [HttpPost("reset-db")]
    [ProducesResponseType(typeof(ResetDbResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ResetDbResponse>> ResetDatabase(CancellationToken cancellationToken)
    {
        if (!_env.IsDevelopment())
        {
            _logger.LogWarning("reset-db was called in non-Development environment; rejecting");
            return StatusCode(403, new ResetDbResponse
            {
                Success = false,
                Message = "This endpoint is only available in Development environment."
            });
        }

        try
        {
            var result = await _resetService.ResetAndSeedAsync(cancellationToken);
            return Ok(new ResetDbResponse
            {
                Success = result.Success,
                TablesWiped = result.TablesWiped,
                ItemsSeeded = result.ItemsSeeded,
                Message = result.Success
                    ? $"Wiped {result.TablesWiped} tables and seeded {result.ItemsSeeded} items."
                    : result.ErrorMessage
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "reset-db failed");
            return StatusCode(500, new ResetDbResponse
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}

public class ResetDbResponse
{
    public bool Success { get; set; }
    public int TablesWiped { get; set; }
    public int ItemsSeeded { get; set; }
    public string Message { get; set; } = string.Empty;
}
