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
}