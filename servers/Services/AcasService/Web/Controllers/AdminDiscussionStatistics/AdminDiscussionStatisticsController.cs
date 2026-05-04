using AcasService.Application.Queries.AdminDiscussionStatistics;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.AdminDiscussionStatistics;

[ApiController]
[Route("api/v1/admin/statistics")]
[Authorize(Roles = "ADMIN")]
public class AdminDiscussionStatisticsController : ControllerBase
{
    private readonly ILogger<AdminDiscussionStatisticsController> _logger;
    private readonly IAdminDiscussionStatisticsQuery _discussionStatsQuery;

    public AdminDiscussionStatisticsController(
        ILogger<AdminDiscussionStatisticsController> logger,
        IAdminDiscussionStatisticsQuery discussionStatsQuery)
    {
        _logger = logger;
        _discussionStatsQuery = discussionStatsQuery;
    }

    [HttpGet("discussions")]
    public async Task<ActionResult<ApiResponse<AdminDiscussionStatisticsResponse>>> GetDiscussionStatistics(
        CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _discussionStatsQuery.GetDiscussionStatisticsAsync(cancellationToken);
            return ResponseUtil.Success(stats, "Discussion statistics retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching discussion statistics.");
            return ResponseUtil.Error<AdminDiscussionStatisticsResponse>("Failed to retrieve discussion statistics", 500);
        }
    }
}
