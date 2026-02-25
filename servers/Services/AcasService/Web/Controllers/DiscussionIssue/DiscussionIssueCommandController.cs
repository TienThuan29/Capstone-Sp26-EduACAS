using AcasService.Application.Commands.DiscussionIssue;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.DiscussionIssue
{
    [ApiController]
    [Route("api/v1/discussion-issues")]
    [Authorize]
    public class DiscussionIssueCommandController : ControllerBase
    {
        private readonly ILogger<DiscussionIssueCommandController> _logger;
        private readonly IDiscussionIssueCommand _command;

        public DiscussionIssueCommandController(
            ILogger<DiscussionIssueCommandController> logger,
            IDiscussionIssueCommand command)
        {
            _logger = logger;
            _command = command;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<DiscussionIssueResponse>>> Create(
            [FromBody] CreateDiscussionIssueRequest request)
        {
            try
            {
                var result = await _command.CreateAsync(request);
                return ResponseUtil.Success(result, "Discussion issue created successfully", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating discussion issue");
                return ResponseUtil.Error<DiscussionIssueResponse>("Failed to create discussion issue", 500);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<DiscussionIssueResponse>>> Update(
            string id,
            [FromBody] UpdateDiscussionIssueRequest request)
        {
            try
            {
                var result = await _command.UpdateAsync(id, request);
                return ResponseUtil.Success(result, "Discussion issue updated successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Discussion issue not found for update");
                return ResponseUtil.Error<DiscussionIssueResponse>("Discussion issue not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating discussion issue");
                return ResponseUtil.Error<DiscussionIssueResponse>("Failed to update discussion issue", 500);
            }
        }

        [HttpPatch("{id}/soft-delete")]
        public async Task<ActionResult<ApiResponse<bool>>> SoftDelete(string id)
        {
            try
            {
                var result = await _command.SoftDeleteAsync(id);
                return ResponseUtil.Success(result != null, "Discussion issue soft-deleted successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Discussion issue not found for soft deletion");
                return ResponseUtil.Error<bool>("Discussion issue not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error soft deleting discussion issue");
                return ResponseUtil.Error<bool>("Failed to soft delete discussion issue", 500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(string id)
        {
            try
            {
                var result = await _command.DeleteAsync(id);
                return ResponseUtil.Success(result != null, "Discussion issue deleted successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Discussion issue not found for deletion");
                return ResponseUtil.Error<bool>("Discussion issue not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting discussion issue");
                return ResponseUtil.Error<bool>("Failed to delete discussion issue", 500);
            }
        }
    }
}
