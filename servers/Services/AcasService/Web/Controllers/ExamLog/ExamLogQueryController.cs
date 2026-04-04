using AcasService.Application.Mappers;
using AcasService.Application.Queries.ExamLog;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ExamLog;

[ApiController]
[Route("api/v1/exam-logs")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class ExamLogQueryController : ControllerBase
{
    private readonly IExamLogQuery _examLogQuery;
    private readonly ExamLogMapper _examLogMapper;
    private readonly ILogger<ExamLogQueryController> _logger;

    public ExamLogQueryController(
        IExamLogQuery examLogQuery,
        ExamLogMapper examLogMapper,
        ILogger<ExamLogQueryController> logger)
    {
        _examLogQuery = examLogQuery;
        _examLogMapper = examLogMapper;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ExamLogResponse>>> GetById([FromRoute] string id)
    {
        try
        {
            var examLog = await _examLogQuery.GetByIdAsync(id);
            if (examLog == null)
                return ResponseUtil.Error<ExamLogResponse>("Exam log not found", 404);

            return ResponseUtil.Success(_examLogMapper.ToResponse(examLog), "Exam log retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting exam log {Id}", id);
            return ResponseUtil.Error<ExamLogResponse>("Failed to get exam log", 500);
        }
    }

    [HttpGet("submission/{submissionId}")]
    public async Task<ActionResult<ApiResponse<List<ExamLogResponse>>>> GetBySubmissionId([FromRoute] string submissionId)
    {
        try
        {
            var examLogs = await _examLogQuery.GetBySubmissionIdAsync(submissionId);
            var response = examLogs.Select(_examLogMapper.ToResponse).ToList();
            return ResponseUtil.Success(response, "Exam logs retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting exam logs for submission {SubmissionId}", submissionId);
            return ResponseUtil.Error<List<ExamLogResponse>>("Failed to get exam logs", 500);
        }
    }
}
