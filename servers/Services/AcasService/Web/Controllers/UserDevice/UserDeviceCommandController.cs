using AcasService.Application.Commands.UserDevice;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.UserDevice;

[ApiController]
[Route("api/v1/device-token")]
[Authorize]
public class UserDeviceCommandController : ControllerBase
{
    private readonly ILogger<UserDeviceCommandController> _logger;
    private readonly IUserDeviceCommand _userDeviceCommand;

    public UserDeviceCommandController(ILogger<UserDeviceCommandController> logger, IUserDeviceCommand userDeviceCommand)
    {
        _logger = logger;
        _userDeviceCommand = userDeviceCommand;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<UserDeviceTokenResponse>>> Register([FromBody] RegisterUserDeviceRequest request)
    {
        try
        {
            var userId = User.FindFirst("id")?.Value;
            if (string.IsNullOrWhiteSpace(userId))
            {
                return ResponseUtil.Error<UserDeviceTokenResponse>("User not authenticated", 401);
            }

            var response = await _userDeviceCommand.RegisterAsync(userId, request);
            return ResponseUtil.Success(response, "Device token registered successfully", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid device platform"))
        {
            return ResponseUtil.Error<UserDeviceTokenResponse>(ex.Message, 400);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Failed to register user device token"))
        {
            return ResponseUtil.Error<UserDeviceTokenResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Register device token error");
            return ResponseUtil.Error<UserDeviceTokenResponse>("Internal Server Error", 500);
        }
    }
}
