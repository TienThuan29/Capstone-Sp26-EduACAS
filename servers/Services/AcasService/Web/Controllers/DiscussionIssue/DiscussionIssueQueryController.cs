using AcasService.Application.Queries.DiscussionIssue;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.DiscussionIssue
{
    [ApiController]
    [Route("api/v1/discussion-issues")]
    [Authorize]
    public class DiscussionIssueQueryController : ControllerBase
    {
        private readonly ILogger<DiscussionIssueQueryController> _logger;
        private readonly IDiscussionIssueQuery _query;

        public DiscussionIssueQueryController(
            ILogger<DiscussionIssueQueryController> logger,
            IDiscussionIssueQuery query)
        {
            _logger = logger;
            _query = query;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<DiscussionIssueResponse>>>> GetAll()
        {
            try
            {
                var issues = await _query.GetAllAsync();
                return ResponseUtil.Success(issues, "Get all discussion issues successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all discussion issues");
                return ResponseUtil.Error<List<DiscussionIssueResponse>>("Internal Server Error", 500);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<DiscussionIssueResponse>>> GetById(string id)
        {
            try
            {
                var issue = await _query.GetByIdAsync(id);
                return ResponseUtil.Success(issue, "Get discussion issue successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Discussion issue not found with id: {Id}", id);
                return ResponseUtil.Error<DiscussionIssueResponse>("Discussion issue not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching discussion issue by id");
                return ResponseUtil.Error<DiscussionIssueResponse>("Internal Server Error", 500);
            }
        }

        [HttpGet("classroom/{classroomId}")]
        public async Task<ActionResult<ApiResponse<List<DiscussionIssueResponse>>>> GetByClassroomId(string classroomId)
        {
            try
            {
                var issues = await _query.GetByClassroomIdAsync(classroomId);
                return ResponseUtil.Success(issues, "Get discussion issues successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching discussion issues for classroom");
                return ResponseUtil.Error<List<DiscussionIssueResponse>>("Internal Server Error", 500);
            }
        }
    }
}
