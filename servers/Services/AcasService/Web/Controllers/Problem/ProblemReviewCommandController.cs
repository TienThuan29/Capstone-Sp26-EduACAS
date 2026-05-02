using AcasService.Application.Commands.Problem;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Problem;

[ApiController]
[Route("api/v1/problems")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class ProblemReviewCommandController : ControllerBase
{
    private readonly IProblemReviewCommand _problemReviewCommand;
    private readonly ILogger<ProblemReviewCommandController> _logger;

    public ProblemReviewCommandController(
        IProblemReviewCommand problemReviewCommand,
        ILogger<ProblemReviewCommandController> logger)
    {
        _problemReviewCommand = problemReviewCommand;
        _logger = logger;
    }

    [HttpPost("review")]
    public async Task<ActionResult<ApiResponse<object>>> ReviewProblem([FromBody] ProblemReviewRequest request)
    {
        try
        {
            var result = await _problemReviewCommand.ReviewProblemAsync(request);
            return ResponseUtil.Success(result, "Problem review completed successfully.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Gemini API error during problem review");
            return ResponseUtil.Error<object>(
                "AI review service is temporarily unavailable. Please try again later.",
                statusCode: 503,
                error: ex.Message
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reviewing problem Title={Title}", request.Title);
            return ResponseUtil.Error<object>(
                "Failed to review problem.",
                error: ex.Message,
                stack: ex.StackTrace
            );
        }
    }
}
