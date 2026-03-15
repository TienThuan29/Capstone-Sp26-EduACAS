using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AcasService.Web.Controllers.Notification;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("SignalR connected: ConnectionId={ConnectionId}, UserId={UserId}",
            Context.ConnectionId, userId ?? "(null)");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("SignalR disconnected: ConnectionId={ConnectionId}, UserId={UserId}",
            Context.ConnectionId, Context.UserIdentifier);
        await base.OnDisconnectedAsync(exception);
    }
}