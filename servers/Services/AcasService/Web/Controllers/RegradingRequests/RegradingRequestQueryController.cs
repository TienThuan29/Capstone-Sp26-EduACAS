using AcasService.Application.Queries.RegradingRequests;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.RegradingRequests;

[ApiController]
[Route("api/v1/regrading-requests")]
[Authorize]
public class RegradingRequestQueryController : ControllerBase
{
    private readonly IRegradingRequestQuery _regradingRequestQuery;
    private readonly ILogger<RegradingRequestQueryController> _logger;

    public RegradingRequestQueryController(
        IRegradingRequestQuery regradingRequestQuery,
        ILogger<RegradingRequestQueryController> logger)
    {
        _regradingRequestQuery = regradingRequestQuery;
        _logger = logger;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<RegradingRequestResponse>>> GetById(string id)
    {
        try
        {
            var result = await _regradingRequestQuery.GetByIdAsync(id);
            return ResponseUtil.Success(result, "Regrading request retrieved successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "RegradingRequest {Id} not found", id);
            return ResponseUtil.Error<RegradingRequestResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting RegradingRequest {Id}", id);
            return ResponseUtil.Error<RegradingRequestResponse>("Failed to get RegradingRequest", 500);
        }
    }

    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<List<RegradingRequestResponse>>>> GetByStudentId(string studentId)
    {
        try
        {
            var result = await _regradingRequestQuery.GetByStudentIdAsync(studentId);
            return ResponseUtil.Success(result, "Regrading requests retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting RegradingRequests for student {StudentId}", studentId);
            return ResponseUtil.Error<List<RegradingRequestResponse>>("Failed to get RegradingRequests", 500);
        }
    }

    [HttpGet("exam/{examId}")]
    [Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<List<RegradingRequestResponse>>>> GetByExamId(string examId)
    {
        try
        {
            var result = await _regradingRequestQuery.GetByExamIdAsync(examId);
            return ResponseUtil.Success(result, "Regrading requests retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting RegradingRequests for exam {ExamId}", examId);
            return ResponseUtil.Error<List<RegradingRequestResponse>>("Failed to get RegradingRequests", 500);
        }
    }

    [HttpGet("submission/{submissionId}")]
    [Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<List<RegradingRequestResponse>>>> GetBySubmissionId(string submissionId)
    {
        try
        {
            var result = await _regradingRequestQuery.GetBySubmissionIdAsync(submissionId);
            return ResponseUtil.Success(result, "Regrading requests retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting RegradingRequests for submission {SubmissionId}", submissionId);
            return ResponseUtil.Error<List<RegradingRequestResponse>>("Failed to get RegradingRequests", 500);
        }
    }

    [HttpGet]
    [Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<PagedResult<RegradingRequestResponse>>>> GetAllPaged(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? studentId = null,
        [FromQuery] string? examId = null,
        [FromQuery] RegradingRequestStatus? status = null)
    {
        try
        {
            var result = await _regradingRequestQuery.GetAllPagedAsync(pageIndex, pageSize, studentId, examId, status);
            return ResponseUtil.Success(result, "Regrading requests retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged RegradingRequests");
            return ResponseUtil.Error<PagedResult<RegradingRequestResponse>>("Failed to get RegradingRequests", 500);
        }
    }
}
