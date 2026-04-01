using AcasService.Repositories.Notification;

namespace AcasService.Application.Commands.Notification;

public interface INotificationCommand
{
    Task<bool> MarkAsReadAsync(string notificationId);
    Task<bool> SoftDeleteAsync(string notificationId);
}

public class NotificationCommand : INotificationCommand
{
    private readonly INotificationRepository _notificationRepository;
    private readonly ILogger<NotificationCommand> _logger;

    public NotificationCommand(
        INotificationRepository notificationRepository,
        ILogger<NotificationCommand> logger)
    {
        _notificationRepository = notificationRepository;
        _logger = logger;
    }

    public async Task<bool> MarkAsReadAsync(string notificationId)
    {
        if (string.IsNullOrWhiteSpace(notificationId))
            throw new ArgumentException("notificationId is required", nameof(notificationId));

        var notification = await _notificationRepository.FindByIdAsync(notificationId);
        if (notification == null)
            throw new KeyNotFoundException("Notification not found");

        notification.IsRead = true;
        var updated = await _notificationRepository.UpdateAsync(notification);
        if (updated == null)
            throw new Exception("Failed to update notification");

        return true;
    }

    public async Task<bool> SoftDeleteAsync(string notificationId)
    {
        if (string.IsNullOrWhiteSpace(notificationId))
            throw new ArgumentException("notificationId is required", nameof(notificationId));

        var notification = await _notificationRepository.FindByIdAsync(notificationId);
        if (notification == null)
            throw new KeyNotFoundException("Notification not found");

        notification.IsDeleted = true;
        var updated = await _notificationRepository.UpdateAsync(notification);
        if (updated == null)
            throw new Exception("Failed to update notification");

        return true;
    }
}

