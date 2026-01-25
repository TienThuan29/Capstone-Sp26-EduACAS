using AuthService.Application.Queries;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Web.Requests;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Web.Controllers.Auth;

[ApiController]
[Route("api/v1")]
public class AuthQueryController : ControllerBase
{
    private readonly ILogger<AuthQueryController> _logger;
    private readonly IUserQuery _userQuery;

    public AuthQueryController(
        ILogger<AuthQueryController> logger,
        IUserQuery userQuery
    )
    {
        _logger = logger;
        _userQuery = userQuery;
    }
    
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileResponse>>> GetProfile()
    {
        try
        {
            var authorizationHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return ResponseUtil.Error<UserProfileResponse>("User not authenticated", 401);
            }

            var accessToken = authorizationHeader.Substring("Bearer ".Length).Trim();
            if (string.IsNullOrEmpty(accessToken))
            {
                return ResponseUtil.Error<UserProfileResponse>("User not authenticated", 401);
            }

            var profile = await _userQuery.GetProfileAsync(accessToken);
            return ResponseUtil.Success(profile, "Profile retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get profile error");
            return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
        }
    }
    
    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<UserProfileResponse>>>> GetAllUsers()
    {
        try
        {
            var users = await _userQuery.GetAllUsersAsync();
            return ResponseUtil.Success(users, "Users retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return ResponseUtil.Error<List<UserProfileResponse>>("Internal Server Error", 500);
        }
    }
}