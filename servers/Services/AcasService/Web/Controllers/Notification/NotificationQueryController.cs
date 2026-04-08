using AcasService.Application.Queries.Notification;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AcasService.Web.Controllers.Notification;

[ApiController]
[Route("api/v1/notifications")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class NotificationQueryController : ControllerBase
{
    private readonly INotificationQuery _notificationQuery;
    private readonly ILogger<NotificationQueryController> _logger;

    public NotificationQueryController(
        INotificationQuery notificationQuery,
        ILogger<NotificationQueryController> logger)
    {
        _notificationQuery = notificationQuery;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationResponse>>>> GetByUserId(
        [FromQuery] string userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
                return ResponseUtil.Error<PagedResult<NotificationResponse>>("userId is required", 400);

            var result = await _notificationQuery.GetNotificationsByUserIdAsync(userId, pageIndex, pageSize);
            return ResponseUtil.Success(result, "Get notifications successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving notifications for user {UserId}", userId);
            return ResponseUtil.Error<PagedResult<NotificationResponse>>(
                "Failed to retrieve notifications.",
                500,
                error: ex.Message,
                stack: ex.StackTrace);
        }
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

    [HttpGet("admin")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationResponse>>>> GetAdminNotifications(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _notificationQuery.GetAllNotificationsAsync(pageIndex, pageSize);
            return ResponseUtil.Success(result, "Notifications retrieved successfully for admin", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for admin");
            return ResponseUtil.Error<PagedResult<NotificationResponse>>("Failed to get notifications", 500);
        }
    }
}
