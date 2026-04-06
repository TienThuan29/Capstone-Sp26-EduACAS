using AcasService.Application.Commands.ExamLog;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ExamLog;

[ApiController]
[Route("api/v1/exam-logs")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class ExamLogCommandController : ControllerBase
{
    private readonly IExamLogCommand _examLogCommand;
    private readonly ILogger<ExamLogCommandController> _logger;

    public ExamLogCommandController(
        IExamLogCommand examLogCommand,
        ILogger<ExamLogCommandController> logger)
    {
        _examLogCommand = examLogCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExamLogResponse>>> Create([FromBody] CreateExamLogRequest request)
    {
        try
        {
            var result = await _examLogCommand.CreateAsync(request);
            if (result == null)
                return ResponseUtil.Error<ExamLogResponse>("Failed to create exam log", 500);

            return ResponseUtil.Success(result, "Exam log created successfully", 201);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating exam log");
            return ResponseUtil.Error<ExamLogResponse>("Failed to create exam log", 500);
        }
    }

    [HttpPost("cache")]
    public async Task<ActionResult<ApiResponse<object>>> Cache([FromBody] CacheExamLogsRequest request)
    {
        try
        {
            var count = await _examLogCommand.CacheAsync(request);
            return ResponseUtil.Success<object>(new { cachedCount = count }, "Exam logs cached successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching exam logs for session {SessionKey}", request.SessionKey);
            return ResponseUtil.Error<object>("Failed to cache exam logs", 500);
        }
    }

    [HttpPost("cache/flush")]
    public async Task<ActionResult<ApiResponse<object>>> FlushCache([FromBody] FlushCachedExamLogsRequest request)
    {
        try
        {
            var count = await _examLogCommand.FlushCachedAsync(request);
            return ResponseUtil.Success<object>(new { flushedCount = count }, "Cached exam logs flushed successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error flushing cached exam logs for session {SessionKey}", request.SessionKey);
            return ResponseUtil.Error<object>("Failed to flush cached exam logs", 500);
        }
    }
}
