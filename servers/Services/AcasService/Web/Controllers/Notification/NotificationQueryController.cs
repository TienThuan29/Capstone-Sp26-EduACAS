using AcasService.Application.Queries.Notification;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Notification;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationQueryController : ControllerBase
{
    private readonly ILogger<NotificationQueryController> _logger;
    private readonly INotificationQuery _notificationQuery;

    public NotificationQueryController(ILogger<NotificationQueryController> logger, INotificationQuery notificationQuery)
    {
        _logger = logger;
        _notificationQuery = notificationQuery;
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<List<NotificationResponse>>>> GetMyNotifications()
    {
        try
        {
            var userId = User.FindFirst("id")?.Value;
            if (string.IsNullOrWhiteSpace(userId))
            {
                return ResponseUtil.Error<List<NotificationResponse>>("User not authenticated", 401);
            }

            var notifications = await _notificationQuery.GetByTargetUserIdAsync(userId);
            return ResponseUtil.Success(notifications, "Notifications retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user notifications");
            return ResponseUtil.Error<List<NotificationResponse>>("Failed to get notifications", 500);
        }
    }

    [HttpGet("target/{targetUserId}")]
    [Authorize(Roles = "ADMIN,LECTURER")]
    public async Task<ActionResult<ApiResponse<List<NotificationResponse>>>> GetByTargetUserId(string targetUserId)
    {
        try
        {
            var notifications = await _notificationQuery.GetByTargetUserIdAsync(targetUserId);
            return ResponseUtil.Success(notifications, "Notifications retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user {TargetUserId}", targetUserId);
            return ResponseUtil.Error<List<NotificationResponse>>("Failed to get notifications", 500);
        }
    }
}
