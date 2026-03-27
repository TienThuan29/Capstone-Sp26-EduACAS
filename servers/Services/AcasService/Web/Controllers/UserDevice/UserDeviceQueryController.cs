using AcasService.Application.Queries.UserDevice;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.UserDevice;

[ApiController]
[Route("api/v1/device-token")]
[Authorize]
public class UserDeviceQueryController : ControllerBase
{
    private readonly ILogger<UserDeviceQueryController> _logger;
    private readonly IUserDeviceQuery _userDeviceQuery;

    public UserDeviceQueryController(ILogger<UserDeviceQueryController> logger, IUserDeviceQuery userDeviceQuery)
    {
        _logger = logger;
        _userDeviceQuery = userDeviceQuery;
    }

    [HttpPost("check")]
    public async Task<ActionResult<ApiResponse<UserDeviceTokenCheckResponse>>> Check([FromBody] CheckUserDeviceTokenRequest request)
    {
        try
        {
            var userId = User.FindFirst("id")?.Value;
            if (string.IsNullOrWhiteSpace(userId))
            {
                return ResponseUtil.Error<UserDeviceTokenCheckResponse>("User not authenticated", 401);
            }

            var response = await _userDeviceQuery.CheckAsync(userId, request);
            return ResponseUtil.Success(response, "Device token checked successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Check device token error");
            return ResponseUtil.Error<UserDeviceTokenCheckResponse>("Internal Server Error", 500);
        }
    }
}
