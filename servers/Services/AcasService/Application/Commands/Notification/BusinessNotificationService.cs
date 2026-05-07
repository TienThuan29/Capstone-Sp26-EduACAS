using AcasService.Models;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.SignalR;
using NotificationHub = AcasService.Web.Controllers.Notification.NotificationHub;

namespace AcasService.Application.Commands.Notification;

public interface IBusinessNotificationService
{
    Task NotifyClassroomAsync(
        string classroomId,
        NotificationType type,
        string title,
        string body,
        string? excludeUserId = null,
        Dictionary<string, object?>? payload = null
    );

    Task NotifyUsersAsync(
        IEnumerable<string> userIds,
        NotificationType type,
        string title,
        string body,
        Dictionary<string, object?>? payload = null
    );

    Task NotifySingleUserAsync(
        string userId,
        NotificationType type,
        string title,
        string body,
        Dictionary<string, object?>? payload = null
    );
}

public class BusinessNotificationService : IBusinessNotificationService
{
    private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;
    private readonly INotificationCommand _notificationCommand;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<BusinessNotificationService> _logger;

    public BusinessNotificationService(
        IClassroomEnrollmentRepository classroomEnrollmentRepository,
        INotificationCommand notificationCommand,
        IHubContext<NotificationHub> hubContext,
        ILogger<BusinessNotificationService> logger)
    {
        _classroomEnrollmentRepository = classroomEnrollmentRepository;
        _notificationCommand = notificationCommand;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyClassroomAsync(
        string classroomId,
        NotificationType type,
        string title,
        string body,
        string? excludeUserId = null,
        Dictionary<string, object?>? payload = null)
    {
        if (string.IsNullOrWhiteSpace(classroomId))
        {
            return;
        }

        var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(classroomId);
        var userIds = enrollments
            .Where(x => x.IsJoining)
            .Select(x => x.StudentId)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (!string.IsNullOrWhiteSpace(excludeUserId))
        {
            userIds = userIds
                .Where(x => !string.Equals(x, excludeUserId, StringComparison.Ordinal))
                .ToList();
        }

        await NotifyUsersAsync(userIds, type, title, body, payload);
    }

    public async Task NotifyUsersAsync(
        IEnumerable<string> userIds,
        NotificationType type,
        string title,
        string body,
        Dictionary<string, object?>? payload = null)
    {
        var normalizedUserIds = userIds
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        foreach (var userId in normalizedUserIds)
        {
            await SendNotificationToUserAsync(userId, type, title, body, payload);
        }
    }

    private async Task SendNotificationToUserAsync(
        string userId,
        NotificationType type,
        string title,
        string body,
        Dictionary<string, object?>? payload)
    {
        try
        {
            var response = await _notificationCommand.CreateAndSendAsync(new CreateNotificationRequest
            {
                TargetUserId = userId,
                Type = type.ToString(),
                Title = title,
                Body = body,
                Payload = payload
            });

            await _hubContext.Clients
                .User(userId)
                .SendAsync("ReceiveNotification", new
                {
                    id = response.NotificationId,
                    targetUserId = userId,
                    title,
                    body,
                    type = type.ToString(),
                    payload = payload ?? new Dictionary<string, object?>(),
                    sentDate = response.SentDate
                });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to dispatch business notification {Type} to user {UserId}",
                type,
                userId
            );
        }
    }

    public async Task NotifySingleUserAsync(
        string userId,
        NotificationType type,
        string title,
        string body,
        Dictionary<string, object?>? payload = null)
    {
        if (string.IsNullOrWhiteSpace(userId)) return;
        await SendNotificationToUserAsync(userId, type, title, body, payload);
    }
}
