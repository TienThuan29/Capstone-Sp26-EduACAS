

using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1")]
public class TestAuthController : ControllerBase
{
    private readonly ILogger<TestAuthController> _logger;

    public TestAuthController(ILogger<TestAuthController> logger)
    {
        _logger = logger;
    }

    [HttpGet("test-unauthorized")]
    public async Task<ActionResult<ApiResponse<string>>> TestUnauhtorized()
    {
        return ResponseUtil.Success<string>("This is unauthorized", "Test unauthorized successful", 200);
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