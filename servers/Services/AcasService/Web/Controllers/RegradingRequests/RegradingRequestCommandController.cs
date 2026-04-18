using AcasService.Application.Commands.RegradingRequests;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.RegradingRequests;

[ApiController]
[Route("api/v1/regrading-requests")]
[Authorize]
public class RegradingRequestCommandController : ControllerBase
{
    private readonly IRegradingRequestCommand _regradingRequestCommand;
    private readonly ILogger<RegradingRequestCommandController> _logger;

    public RegradingRequestCommandController(
        IRegradingRequestCommand regradingRequestCommand,
        ILogger<RegradingRequestCommandController> logger)
    {
        _regradingRequestCommand = regradingRequestCommand;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "STUDENT, ADMIN")]
    public async Task<ActionResult<ApiResponse<RegradingRequestResponse>>> Create(
        [FromBody] CreateRegradingRequest request,
        [FromHeader(Name = "X-User-Id")] string studentId)
    {
        try
        {
            if (string.IsNullOrEmpty(studentId))
                return ResponseUtil.Error<RegradingRequestResponse>("Student ID is required", 400);

            // Validate request
            var validationResults = request.Validate().ToList();
            if (validationResults.Count > 0)
            {
                var errorMessages = validationResults.Select(vr => vr.ErrorMessage).ToList();
                return ResponseUtil.Error<RegradingRequestResponse>(
                    string.Join("; ", errorMessages), 400);
            }

            var result = await _regradingRequestCommand.CreateAsync(request, studentId);
            return ResponseUtil.Success(result, "Regrading request created successfully", 201);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Submission not found for request");
            return ResponseUtil.Error<RegradingRequestResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating RegradingRequest");
            return ResponseUtil.Error<RegradingRequestResponse>("Failed to create RegradingRequest", 500);
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<RegradingRequestResponse>>> Approve(
        string id,
        [FromBody] HandleRegradingRequest request)
    {
        try
        {
            var result = await _regradingRequestCommand.ApproveAsync(id, request.LecturerNote);
            return ResponseUtil.Success(result, "Regrading request approved successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "RegradingRequest {Id} not found", id);
            return ResponseUtil.Error<RegradingRequestResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving RegradingRequest {Id}", id);
            return ResponseUtil.Error<RegradingRequestResponse>("Failed to approve RegradingRequest", 500);
        }
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "LECTURER, ADMIN")]
    public async Task<ActionResult<ApiResponse<RegradingRequestResponse>>> Reject(
        string id,
        [FromBody] HandleRegradingRequest request)
    {
        try
        {
            var result = await _regradingRequestCommand.RejectAsync(id, request.LecturerNote);
            return ResponseUtil.Success(result, "Regrading request rejected successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "RegradingRequest {Id} not found", id);
            return ResponseUtil.Error<RegradingRequestResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting RegradingRequest {Id}", id);
            return ResponseUtil.Error<RegradingRequestResponse>("Failed to reject RegradingRequest", 500);
        }
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<RegradingRequestResponse>>> Cancel(string id)
    {
        try
        {
            var result = await _regradingRequestCommand.CancelAsync(id);
            return ResponseUtil.Success(result, "Regrading request canceled successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "RegradingRequest {Id} not found", id);
            return ResponseUtil.Error<RegradingRequestResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling RegradingRequest {Id}", id);
            return ResponseUtil.Error<RegradingRequestResponse>("Failed to cancel RegradingRequest", 500);
        }
    }
}
