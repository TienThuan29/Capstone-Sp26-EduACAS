using AcasService.Application.Commands.Comment;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Comment
{
    [ApiController]
    [Route("api/v1/comments")]
    [Authorize]
    public class CommentCommandController : ControllerBase
    {
        private readonly ILogger<CommentCommandController> _logger;
        private readonly ICommentCommand _command;

        public CommentCommandController(
            ILogger<CommentCommandController> logger,
            ICommentCommand command)
        {
            _logger = logger;
            _command = command;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<CommentResponse>>> Create(
            [FromBody] CreateCommentRequest request)
        {
            try
            {
                var result = await _command.CreateAsync(request);
                return ResponseUtil.Success(result, "Comment created successfully", 201);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Discussion issue not found");
                return ResponseUtil.Error<CommentResponse>("Discussion issue not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment");
                return ResponseUtil.Error<CommentResponse>("Failed to create comment", 500);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<CommentResponse>>> Update(
            string id,
            [FromBody] UpdateCommentRequest request)
        {
            try
            {
                var result = await _command.UpdateAsync(id, request);
                return ResponseUtil.Success(result, "Comment updated successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Comment not found for update");
                return ResponseUtil.Error<CommentResponse>("Comment not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating comment");
                return ResponseUtil.Error<CommentResponse>("Failed to update comment", 500);
            }
        }

        [HttpPatch("{id}/soft-delete")]
        public async Task<ActionResult<ApiResponse<bool>>> SoftDelete(string id)
        {
            try
            {
                var result = await _command.SoftDeleteAsync(id);
                return ResponseUtil.Success(result != null, "Comment soft-deleted successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Comment not found for soft deletion");
                return ResponseUtil.Error<bool>("Comment not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error soft deleting comment");
                return ResponseUtil.Error<bool>("Failed to soft delete comment", 500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(string id)
        {
            try
            {
                var result = await _command.DeleteAsync(id);
                return ResponseUtil.Success(result != null, "Comment deleted successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Comment not found for deletion");
                return ResponseUtil.Error<bool>("Comment not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment");
                return ResponseUtil.Error<bool>("Failed to delete comment", 500);
            }
        }
    }
}
