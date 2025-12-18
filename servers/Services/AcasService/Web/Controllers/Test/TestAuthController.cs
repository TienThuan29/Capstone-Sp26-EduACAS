

using AcasService.Application.Utils;
using AcasService.Messaging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1")]
public class TestAuthController : ControllerBase
{
    private readonly ILogger<TestAuthController> _logger;
    private readonly UserRequestProducer _userRequestProducer;

    public TestAuthController(
        ILogger<TestAuthController> logger,
        UserRequestProducer userRequestProducer)
    {
        _logger = logger;
        _userRequestProducer = userRequestProducer;
    }

    [HttpGet("test-unauthorized")]
    public async Task<ActionResult<ApiResponse<string>>> TestUnauhtorized()
    {
        return ResponseUtil.Success<string>("This is unauthorized", "Test unauthorized successful", 200);
    }

    [HttpGet("test-get-user/{userId}")]
    public async Task<ActionResult<ApiResponse<UserProfileResponse>>> TestGetUserFromMessageQueue([FromRoute] string userId)
    {
        try
        {
            // _logger.LogInformation("Requesting user info via RabbitMQ: UserId={UserId}", userId);
            var userProfile = await _userRequestProducer.GetUserByIdAsync(userId);
            if (userProfile == null)
            {
                return ResponseUtil.Error<UserProfileResponse>("User not found", 404);
            }
            return ResponseUtil.Success(userProfile, "User retrieved successfully via RabbitMQ", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user via RabbitMQ: UserId={UserId}", userId);
            return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
        }
    }

    [HttpGet("test-admin")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<string>>> TestAdminAuthorization()
    {
        return ResponseUtil.Success<string>("This is admin", "Test authorization successful", 200);
    }

    [HttpGet("test-lecturer")]
    [Authorize(Roles = "LECTURER")]
    public async Task<ActionResult<ApiResponse<string>>> TestLecturerAuthorization()
    {
        return ResponseUtil.Success<string>("This is lecturer", "Test authorization successful", 200);
    }

    [HttpGet("test-student")]
    [Authorize(Roles = "STUDENT")]
    public async Task<ActionResult<ApiResponse<string>>> TestStudentAuthorization()
    {
        return ResponseUtil.Success<string>("This is student", "Test authorization successful", 200);
    }

}