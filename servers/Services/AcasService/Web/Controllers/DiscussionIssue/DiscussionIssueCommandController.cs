using AcasService.Application.Commands.DiscussionIssue;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.DiscussionIssue;

[ApiController]
[Route("api/v1/discussion-issues")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class DiscussionIssueCommandController : ControllerBase
{
    private readonly IDiscussionIssueCommand _discussionIssueCommand;
    private readonly ILogger<DiscussionIssueCommandController> _logger;

    public DiscussionIssueCommandController(
        IDiscussionIssueCommand discussionIssueCommand,
        ILogger<DiscussionIssueCommandController> logger)
    {
        _discussionIssueCommand = discussionIssueCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> CreateIssue(
        [FromBody] CreateDiscussionIssueRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            var result = await _discussionIssueCommand.CreateIssueAsync(request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to create discussion issue", 500);

            return ResponseUtil.Success(result, "Discussion issue created successfully", 201);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating discussion issue");
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to create discussion issue", 500);
        }
    }

    [HttpPut("{issueId}")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> UpdateIssue(
        string issueId,
        [FromBody] UpdateDiscussionIssueRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            var result = await _discussionIssueCommand.UpdateIssueAsync(issueId, request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Discussion issue not found", 404);

            return ResponseUtil.Success(result, "Discussion issue updated successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating discussion issue {IssueId}", issueId);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to update discussion issue", 500);
        }
    }

    [HttpPost("comments")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> WriteComment(
        [FromBody] WriteCommentRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            var result = await _discussionIssueCommand.WriteCommentAsync(request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Issue not found or failed to add comment", 404);

            return ResponseUtil.Success(result, "Comment added successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing comment to issue {IssueId}", request?.IssueId);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to add comment", 500);
        }
    }

    [HttpPost("comments/reply")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> ReplyComment(
        [FromBody] ReplyCommentRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            var result = await _discussionIssueCommand.ReplyCommentAsync(request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Issue or parent comment not found", 404);

            return ResponseUtil.Success(result, "Reply added successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replying to comment {ParentCommentId}", request?.ParentCommentId);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to add reply", 500);
        }
    }

    [HttpPost("comments/upvote")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> UpvoteComment(
        [FromBody] UpvoteCommentRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            var result = await _discussionIssueCommand.UpvoteCommentAsync(request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Issue or comment not found", 404);

            return ResponseUtil.Success(result, "Comment upvoted successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upvoting comment {CommentId}", request?.CommentId);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to upvote comment", 500);
        }
    }

    [HttpPatch("{issueId}/status")]
    [Authorize(Roles = "LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> ChangeStatus(
        string issueId,
        [FromBody] ChangeDiscussionStatusRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            request.IssueId = issueId;
            var result = await _discussionIssueCommand.ChangeStatusAsync(request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Discussion issue not found", 404);

            return ResponseUtil.Success(result, "Status updated successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing status for issue {IssueId}", issueId);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to update status", 500);
        }
    }

    [HttpPatch("{issueId}/soft-delete")]
    public async Task<ActionResult<ApiResponse<bool>>> SoftDelete(string issueId)
    {
        try
        {
            var result = await _discussionIssueCommand.SoftDeleteAsync(issueId);
            if (!result)
                return ResponseUtil.Error<bool>("Discussion issue not found", 404);
            return ResponseUtil.Success(true, "Discussion issue deleted", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting issue {IssueId}", issueId);
            return ResponseUtil.Error<bool>("Failed to delete discussion issue", 500);
        }
    }

    [HttpPut("comments/{commentId}")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> UpdateComment(
        string commentId,
        [FromBody] UpdateCommentRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            request.CommentId = commentId;
            var result = await _discussionIssueCommand.UpdateCommentAsync(request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Issue or comment not found", 404);

            return ResponseUtil.Success(result, "Comment updated successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating comment {CommentId}", commentId);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to update comment", 500);
        }
    }

    [HttpPatch("comments/{commentId}/soft-delete")]
    public async Task<ActionResult<ApiResponse<DiscussionIssueDetailResponse>>> SoftDeleteComment(
        string commentId,
        [FromBody] SoftDeleteCommentRequest request)
    {
        try
        {
            if (request == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Request body is required", 400);

            request.CommentId = commentId;
            var result = await _discussionIssueCommand.SoftDeleteCommentAsync(request);
            if (result == null)
                return ResponseUtil.Error<DiscussionIssueDetailResponse>("Issue or comment not found", 404);

            return ResponseUtil.Success(result, "Comment deleted", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting comment {CommentId}", commentId);
            return ResponseUtil.Error<DiscussionIssueDetailResponse>("Failed to delete comment", 500);
        }
    }
}
