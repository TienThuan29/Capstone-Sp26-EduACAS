using AcasService.Application.Queries.PublicStatistics;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.PublicStatistics;

[ApiController]
[Route("api/v1/public-statistics")]
[AllowAnonymous]
public class PublicStatisticsQueryController : ControllerBase
{
    private readonly ILogger<PublicStatisticsQueryController> _logger;
    private readonly IPublicStatisticsQuery _publicStatisticsQuery;

    public PublicStatisticsQueryController(
        ILogger<PublicStatisticsQueryController> logger,
        IPublicStatisticsQuery publicStatisticsQuery
    )
    {
        _logger = logger;
        _publicStatisticsQuery = publicStatisticsQuery;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PublicStatisticsResponse>>> GetStatistics(
        CancellationToken cancellationToken
    )
    {
        try
        {
            var statistics = await _publicStatisticsQuery.GetStatisticsAsync(cancellationToken);
            return ResponseUtil.Success(statistics, "Public statistics retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching public statistics.");
            return ResponseUtil.Error<PublicStatisticsResponse>("Failed to retrieve public statistics", 500);
        }
    }
}
