using AcasService.Application.Queries.Comment;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Comment
{
    [ApiController]
    [Route("api/v1/comments")]
    [Authorize]
    public class CommentQueryController : ControllerBase
    {
        private readonly ILogger<CommentQueryController> _logger;
        private readonly ICommentQuery _query;

        public CommentQueryController(
            ILogger<CommentQueryController> logger,
            ICommentQuery query)
        {
            _logger = logger;
            _query = query;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<CommentResponse>>> GetById(string id)
        {
            try
            {
                var comment = await _query.GetByIdAsync(id);
                return ResponseUtil.Success(comment, "Get comment successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Comment not found with id: {Id}", id);
                return ResponseUtil.Error<CommentResponse>("Comment not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching comment by id");
                return ResponseUtil.Error<CommentResponse>("Internal Server Error", 500);
            }
        }

        [HttpGet("discussion-issue/{discussionIssueId}")]
        public async Task<ActionResult<ApiResponse<List<CommentResponse>>>> GetByDiscussionIssueId(string discussionIssueId)
        {
            try
            {
                var comments = await _query.GetByDiscussionIssueIdAsync(discussionIssueId);
                return ResponseUtil.Success(comments, "Get comments successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching comments for discussion issue");
                return ResponseUtil.Error<List<CommentResponse>>("Internal Server Error", 500);
            }
        }
    }
}
