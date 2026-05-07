using AcasService.Application.Commands.Problem;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Problem;

[ApiController]
[Route("api/v1/testcase-generation")]
public class TestcaseGenerationController : ControllerBase
{
    private readonly ITestcaseCommand _testcaseCommand;
    private readonly ILogger<TestcaseGenerationController> _logger;

    public TestcaseGenerationController(
        ITestcaseCommand testcaseCommand,
        ILogger<TestcaseGenerationController> logger)
    {
        _testcaseCommand = testcaseCommand;
        _logger = logger;
    }

    [HttpPost("preview")]
    public async Task<ActionResult<ApiResponse<List<TestCaseResponse>>>> GeneratePreview(
        [FromBody] TestcaseGenerationPreviewRequest request)
    {
        if (request == null)
        {
            return ResponseUtil.Error<List<TestCaseResponse>>("Request body is required", 400);
        }

        try
        {
            var count = request.NumberOfTestcases <= 0 ? 4 : request.NumberOfTestcases;
            var testcases = await _testcaseCommand.GenerateFromStringAsync(request.Content, count);
            return ResponseUtil.Success(testcases, "Generated testcases successfully", 200);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid testcase generation request");
            return ResponseUtil.Error<List<TestCaseResponse>>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating testcases with Gemini");
            return ResponseUtil.Error<List<TestCaseResponse>>(
                "Failed to generate testcases",
                statusCode: 500,
                error: ex.Message,
                stack: ex.StackTrace ?? string.Empty);
        }
    }
}