using AcasService.Application.Commands.Notification;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Notification;

[ApiController]
[Route("api/v1/notifications")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class NotificationCommandController : ControllerBase
{
    private readonly ILogger<NotificationCommandController> _logger;
    private readonly INotificationCommand _notificationCommand;

    public NotificationCommandController(
        ILogger<NotificationCommandController> logger,
        INotificationCommand notificationCommand)
    {
        _logger = logger;
        _notificationCommand = notificationCommand;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NotificationDispatchResponse>>> CreateAndPush([FromBody] CreateNotificationRequest request)
    {
        try
        {
            var response = await _notificationCommand.CreateAndSendAsync(request);
            return ResponseUtil.Success(response, "Notification pushed successfully", 201);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid notification type"))
        {
            return ResponseUtil.Error<NotificationDispatchResponse>(ex.Message, 400);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Failed to create notification"))
        {
            return ResponseUtil.Error<NotificationDispatchResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification");
            return ResponseUtil.Error<NotificationDispatchResponse>("Failed to create notification", 500);
        }
    }

    [HttpPatch("{id}/mark-read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead([FromRoute] string id)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(id))
                return ResponseUtil.Error<bool>("Notification id is required", 400);

            var result = await _notificationCommand.MarkAsReadAsync(id);
            return ResponseUtil.Success(result, "Notification marked as read", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Notification not found for mark-read: {Id}", id);
            return ResponseUtil.Error<bool>("Notification not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read: {Id}", id);
            return ResponseUtil.Error<bool>("Failed to mark notification as read", 500);
        }
    }

    [HttpPatch("{id}/soft-delete")]
    public async Task<ActionResult<ApiResponse<bool>>> SoftDelete([FromRoute] string id)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(id))
                return ResponseUtil.Error<bool>("Notification id is required", 400);

            var result = await _notificationCommand.SoftDeleteAsync(id);
            return ResponseUtil.Success(result, "Notification soft-deleted successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Notification not found for soft-delete: {Id}", id);
            return ResponseUtil.Error<bool>("Notification not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft-deleting notification: {Id}", id);
            return ResponseUtil.Error<bool>("Failed to soft-delete notification", 500);
        }
    }
}
