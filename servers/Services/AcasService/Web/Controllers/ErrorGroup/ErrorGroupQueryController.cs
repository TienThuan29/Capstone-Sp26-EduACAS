using AcasService.Application.Queries.ErrorGroup;
using AcasService.Application.Utils;
using AcasService.Application.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcasService.Application.ResponseDTOs;

namespace AcasService.Web.Controllers.ErrorGroup;

[ApiController]
[Route("api/v1/error-groups")]
[Authorize(Roles = "LECTURER")]
public class ErrorGroupQueryController : ControllerBase
{
    private readonly IErrorGroupQuery _errorGroupQuery;
    private readonly ErrorGroupMapper _errorGroupMapper;
    private readonly ILogger<ErrorGroupQueryController> _logger;

    public ErrorGroupQueryController(
        IErrorGroupQuery errorGroupQuery,
        ErrorGroupMapper errorGroupMapper,
        ILogger<ErrorGroupQueryController> logger)
    {
        _errorGroupQuery = errorGroupQuery;
        _errorGroupMapper = errorGroupMapper;
        _logger = logger;
    }

    
    [HttpGet("exam/{examId}/problem/{problemId}")]
    public async Task<ActionResult<ApiResponse<List<ErrorGroupSummaryResponse>>>> GetByProblemId([FromRoute] string examId, [FromRoute] string problemId)
    {
        try
        {
            var groups = await _errorGroupQuery.GetByProblemIdAsync(examId, problemId);
            var response = groups.Select(_errorGroupMapper.ToSummaryResponse).ToList();
            return ResponseUtil.Success(response, "Error groups summary retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting error groups summary for exam {ExamId}, problem {ProblemId}", examId, problemId);
            return ResponseUtil.Error<List<ErrorGroupSummaryResponse>>("Failed to get error groups summary", 500);
        }
    }

    
    [HttpGet("exam/{examId}")]
    public async Task<ActionResult<ApiResponse<List<ErrorGroupSummaryResponse>>>> GetByExamId([FromRoute] string examId)
    {
        try
        {
            var groups = await _errorGroupQuery.GetByExamIdAsync(examId);
            var response = groups.Select(_errorGroupMapper.ToSummaryResponse).ToList();
            return ResponseUtil.Success(response, "Error groups for exam retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting error groups for exam {ExamId}", examId);
            return ResponseUtil.Error<List<ErrorGroupSummaryResponse>>("Failed to get error groups for exam", 500);
        }
    }

    
    [HttpGet("{groupId}")]
    public async Task<ActionResult<ApiResponse<ErrorGroupDetailResponse>>> GetById([FromRoute] string groupId)
    {
        try
        {
            var group = await _errorGroupQuery.GetByIdAsync(groupId);
            if (group == null)
                return ResponseUtil.Error<ErrorGroupDetailResponse>("Error group not found", 404);

            var response = _errorGroupMapper.ToDetailResponse(group);
            return ResponseUtil.Success(response, "Error group detail retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting error group detail for ID {GroupId}", groupId);
            return ResponseUtil.Error<ErrorGroupDetailResponse>("Failed to get error group detail", 500);
        }
    }
}
