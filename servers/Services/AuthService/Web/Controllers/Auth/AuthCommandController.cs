using AuthService.Application.Commands;
using AuthService.Application.Queries;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Web.Requests;
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
}