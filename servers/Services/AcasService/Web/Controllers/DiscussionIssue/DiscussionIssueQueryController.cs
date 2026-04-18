using AcasService.Application.Queries.DiscussionIssue;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.DiscussionIssue;

[ApiController]
[Route("api/v1/discussion-issues")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class DiscussionIssueQueryController : ControllerBase
{
    private readonly IDiscussionIssueQuery _discussionIssueQuery;
    private readonly ILogger<DiscussionIssueQueryController> _logger;

    public DiscussionIssueQueryController(
        IDiscussionIssueQuery discussionIssueQuery,
        ILogger<DiscussionIssueQueryController> logger)
    {
        _discussionIssueQuery = discussionIssueQuery;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DiscussionIssueListResponse>>>> GetPagedByClassroom(
        [FromQuery] string classroomId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(classroomId))
                return ResponseUtil.Error<PagedResult<DiscussionIssueListResponse>>("classroomId is required", 400);

            var result = await _discussionIssueQuery.GetPagedByClassroomIdAsync(classroomId, pageIndex, pageSize);
            return ResponseUtil.Success(result, "Get discussion issues successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching discussion issues for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<PagedResult<DiscussionIssueListResponse>>("Internal Server Error", 500);
        }
    }

    [HttpGet("count")]
    public async Task<ActionResult<ApiResponse<int>>> GetCountByClassroom([FromQuery] string classroomId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(classroomId))
                return ResponseUtil.Error<int>("classroomId is required", 400);

            var count = await _discussionIssueQuery.GetCountByClassroomIdAsync(classroomId);
            return ResponseUtil.Success(count, "Get count successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting discussion issues for classroom {ClassroomId}", classroomId);
            return ResponseUtil.Error<int>("Internal Server Error", 500);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> GetById(string id)
    {
        try
        {
            var issue = await _discussionIssueQuery.GetByIdAsync(id);
            if (issue == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Discussion issue not found", 404);

            return ResponseUtil.Success(issue, "Get discussion issue successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching discussion issue {Id}", id);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Internal Server Error", 500);
        }
    }

    [HttpGet("admin")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<PagedResult<DiscussionIssueListResponse>>>> GetAdminDiscussionIssues(
        [FromQuery] string? search = null,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _discussionIssueQuery.GetAllDiscussionIssuesAsync(search, pageIndex, pageSize);
            return ResponseUtil.Success(result, "Get discussion issues for admin successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all discussion issues for admin");
            return ResponseUtil.Error<PagedResult<DiscussionIssueListResponse>>("Internal Server Error", 500);
        }
    }
}
