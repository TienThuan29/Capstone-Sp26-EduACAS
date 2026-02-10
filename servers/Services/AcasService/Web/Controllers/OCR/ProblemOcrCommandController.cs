using AcasService.Application.Commands.OCR;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.OCR
{
    [ApiController]
    [Route("api/v1/ocr")]
    [Authorize(Roles = "LECTURER")]
    public class ProblemOcrCommandController : ControllerBase
    {
        private readonly IProblemOcrCommand _problemOcrCommand;
        private readonly ILogger<ProblemOcrCommandController> _logger;
        public ProblemOcrCommandController(
            IProblemOcrCommand problemOcrCommand,
            ILogger<ProblemOcrCommandController> logger)
        {
            _problemOcrCommand = problemOcrCommand;
            _logger = logger;
        }
        [HttpPost("extract")]
        public async Task<ActionResult<ApiResponse<object>>> ExtractContent(
            [FromBody] ExtractOcrRequest request)
        {
            try
            {
                var markdown = await _problemOcrCommand.ExtractContentFromFileAsync(request.FileName);
                return ResponseUtil.Success( 
                    new { content = markdown },
                    "Content extracted successfully from file."
                );
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "File operation error for {FileName}", request.FileName);
                return ResponseUtil.Error<object>(
                    ex.Message,
                    statusCode: 404
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to extract content from {FileName}", request.FileName);
                return ResponseUtil.Error<object>(
                    "Failed to extract content from file.",
                    error: ex.Message,
                    stack: ex.StackTrace
                );
            }
        }
    }
}
