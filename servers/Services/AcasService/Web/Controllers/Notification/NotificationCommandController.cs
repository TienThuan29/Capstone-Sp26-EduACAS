using AcasService.Application.Commands.Notification;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Notification;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationCommandController : ControllerBase
{
    private readonly ILogger<NotificationCommandController> _logger;
    private readonly INotificationCommand _notificationCommand;

    public NotificationCommandController(ILogger<NotificationCommandController> logger, INotificationCommand notificationCommand)
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
}
