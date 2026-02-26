using AuthService.Application.Commands;
using AuthService.Application.Queries;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Web.Controllers.TestController;

[ApiController]
[Route("api/v1")]
public class AuthCommandController : ControllerBase
{
    private readonly ILogger<AuthCommandController> _logger;
    private readonly IUserCommand _userCommand;
    private readonly IUserQuery _userQuery;

    public AuthCommandController(
        ILogger<AuthCommandController> logger,
        IUserCommand userCommand,
        IUserQuery userQuery
    )
    {
        _logger = logger;
        _userCommand = userCommand;
        _userQuery = userQuery;
    }

    [HttpPost("authenticate")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> AuthenticateUser([FromBody] LoginCredentials loginCredentials)
    {
        try
        {
            var authResponse = await _userQuery.AuthenticateAsync(loginCredentials);
            return ResponseUtil.Success(authResponse, "Login successful", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid email or password"))
        {
            return ResponseUtil.Error<AuthResponse>("Invalid email or password", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authentication error");
            return ResponseUtil.Error<AuthResponse>("Internal Server Error", 500);
        }
    }

    [HttpPost("google-login")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> GoogleLogin([FromBody] GoogleLoginRequest googleLoginRequest)
    {
        try
        {
            var authResponse = await _userQuery.AuthenticateWithGoogleAsync(googleLoginRequest.IdToken);
            return ResponseUtil.Success(authResponse, "Google login successful", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid Google token"))
        {
            return ResponseUtil.Error<AuthResponse>("Invalid Google token", 401);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("User not found"))
        {
            return ResponseUtil.Error<AuthResponse>("User not found with this email", 404);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("User is forbidden"))
        {
            return ResponseUtil.Error<AuthResponse>("User is forbidden", 403);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Google ID does not match"))
        {
            return ResponseUtil.Error<AuthResponse>("Google ID does not match this account", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google login error");
            return ResponseUtil.Error<AuthResponse>("Internal Server Error", 500);
        }
    }

    [HttpPost("register")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> CreateUser([FromBody] RegisterData registerData)
    {
        try
        {
            var authResponse = await _userCommand.CreateUserAsync(registerData);
            _logger.LogInformation("Register response: {Response}", System.Text.Json.JsonSerializer.Serialize(authResponse));
            return ResponseUtil.Success(authResponse, "Account created successfully", 201);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Email already exists"))
        {
            return ResponseUtil.Error<AuthResponse>("Email already exists", 400);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("error occurred while creating"))
        {
            return ResponseUtil.Error<AuthResponse>("An error occurred while creating the account", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Account creation error");
            return ResponseUtil.Error<AuthResponse>("Internal Server Error", 500);
        }
    }

    [HttpPost("register-verification")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<object>>> RegisterWithEmailVerification([FromBody] RegisterData registerData)
    {
        try
        {
            var registerSession = await _userCommand.RegisterWithEmailVerificationAsync(registerData);
            return ResponseUtil.Success(new { RegisterSession = registerSession }, "Email verification sent successfully");
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Email already exists"))
        {
            return ResponseUtil.Error<object>("Email already exists", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email verification error");
            return ResponseUtil.Error<object>("Internal Server Error", 500);
        }
    }

    [HttpPost("verify-email")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyEmail([FromBody] VerifyEmailRequest verifyEmailRequest)
    {
        try
        {
            var isVerified = await _userCommand.VerifyEmailAsync(verifyEmailRequest);
            return ResponseUtil.Success(new { IsVerified = isVerified }, "Email verified successfully");
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid register session"))
        {
            return ResponseUtil.Error<object>("Invalid register session", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email verification error");
            return ResponseUtil.Error<object>("Internal Server Error", 500);
        }
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<object>>> SendForgotPasswordLink([FromBody] ForgotPasswordRequest forgotPasswordRequest)
    {
        try
        {
            var isSent = await _userCommand.SendForgotPasswordLinkAsync(forgotPasswordRequest);
            return ResponseUtil.Success(new { }, "Forgot password link sent successfully");
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("User not found"))
        {
            return ResponseUtil.Error<object>("User not found", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Forgot password link error");
            return ResponseUtil.Error<object>("Internal Server Error", 500);
        }
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordRequest resetPasswordRequest)
    {
        try
        {
            var isReset = await _userCommand.ResetPasswordAsync(resetPasswordRequest);
            return ResponseUtil.Success(new { }, "Password reset successfully");
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid token"))
        {
            return ResponseUtil.Error<object>("Invalid token", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Password reset error");
            return ResponseUtil.Error<object>("Internal Server Error", 500);
        }
    }

    [HttpPost("grant-account")]
    [Authorize(Roles = "ADMIN")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<GrantAccountResponse>>> GrantAccount([FromBody] GrantAccountRequest grantAccountRequest)
    {
        try
        {
            // Get the requester's user ID from the Authorization header
            // var authorizationHeader = Request.Headers["Authorization"].FirstOrDefault();
            // if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            // {
            //     return ResponseUtil.Error<GrantAccountResponse>("Authorization token is required", 401);
            // }

            // var accessToken = authorizationHeader.Substring("Bearer ".Length).Trim();
            // var requesterProfile = await _userQuery.GetProfileAsync(accessToken);
            
            var grantResponse = await _userCommand.GrantAccountAsync(grantAccountRequest);
            return ResponseUtil.Success(grantResponse, "Account granted successfully and credentials sent to email", 201);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Only Admin can grant"))
        {
            return ResponseUtil.Error<GrantAccountResponse>(ex.Message, 403);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Admin can only grant"))
        {
            return ResponseUtil.Error<GrantAccountResponse>(ex.Message, 403);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            return ResponseUtil.Error<GrantAccountResponse>(ex.Message, 400);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return ResponseUtil.Error<GrantAccountResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Grant account error");
            return ResponseUtil.Error<GrantAccountResponse>("Internal Server Error", 500);
        }
    }

    [HttpPost("reset-first-login-password")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<ApiResponse<object>>> ResetFirstLoginPassword([FromBody] ResetFirstLoginPasswordRequest resetFirstLoginRequest)
    {
        try
        {
            // Get the user's authentication token
            var authorizationHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return ResponseUtil.Error<object>("Authorization token is required", 401);
            }

            var accessToken = authorizationHeader.Substring("Bearer ".Length).Trim();
            var userProfile = await _userQuery.GetProfileAsync(accessToken);
            
            // Verify that the user is resetting their own password
            if (!userProfile.Email.Equals(resetFirstLoginRequest.Email, StringComparison.OrdinalIgnoreCase))
            {
                return ResponseUtil.Error<object>("Information mismatch. You can only reset your own password", 403);
            }
            
            var isReset = await _userCommand.ResetFirstLoginPasswordAsync(resetFirstLoginRequest);
            return ResponseUtil.Success(new { }, "Password reset successfully. Please log in with your new password", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("User not found"))
        {
            return ResponseUtil.Error<object>("User not found", 404);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("only for users on first login"))
        {
            return ResponseUtil.Error<object>(ex.Message, 400);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Failed to reset password"))
        {
            return ResponseUtil.Error<object>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Reset first login password error");
            return ResponseUtil.Error<object>("Internal Server Error", 500);
        }
    }


    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserProfileResponse>>> UpdateProfile([FromBody] UpdateProfileRequest updateProfileRequest)
    {
        try
        {
            var authorizationHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return ResponseUtil.Error<UserProfileResponse>("Authorization token is required", 401);
            }

            var accessToken = authorizationHeader.Substring("Bearer ".Length).Trim();
            if (string.IsNullOrEmpty(accessToken))
            {
                return ResponseUtil.Error<UserProfileResponse>("User not authenticated", 401);
            }

            var fullname = string.IsNullOrWhiteSpace(updateProfileRequest.Fullname) ? null : updateProfileRequest.Fullname.Trim();
            var avatarUrl = string.IsNullOrWhiteSpace(updateProfileRequest.AvatarUrl) ? null : updateProfileRequest.AvatarUrl.Trim();

            DateTime? birthday = null;
            if (!string.IsNullOrWhiteSpace(updateProfileRequest.Birthday) && DateTime.TryParse(updateProfileRequest.Birthday, out var parsedBirthday))
            {
                birthday = parsedBirthday;
            }

            var updatedProfile = await _userCommand.UpdateProfileAsync(accessToken, fullname, birthday, avatarUrl);
            return ResponseUtil.Success(updatedProfile, "Profile updated successfully", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Failed to update profile"))
        {
            return ResponseUtil.Error<UserProfileResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update profile error");
            return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
        }
    }

    [HttpPut("users/{userId}")]
    public async Task<ActionResult<ApiResponse<UserProfileResponse>>> UpdateUser(string userId, [FromBody] UpdateUserRequest updateUserRequest)
    {
        try
        {
            // Normalize empty strings to null
            var fullname = string.IsNullOrWhiteSpace(updateUserRequest.Fullname) ? null : updateUserRequest.Fullname;
            var roleNumber = string.IsNullOrWhiteSpace(updateUserRequest.RoleNumber) ? null : updateUserRequest.RoleNumber;
            var role = updateUserRequest.GetRoleEnum();
            
            var updatedUser = await _userCommand.UpdateUserAsync(
                userId,
                fullname,
                roleNumber,
                role,
                updateUserRequest.IsEnable
            );
            return ResponseUtil.Success(updatedUser, "User updated successfully", 200);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Failed to update user"))
        {
            return ResponseUtil.Error<UserProfileResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update user error");
            return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
        }
    }
}
