using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Notification;
using AcasService.Repositories.UserDevice;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Notification;

public interface INotificationCommand
{
    Task<bool> MarkAsReadAsync(string notificationId);
    Task<bool> SoftDeleteAsync(string notificationId);
    Task<NotificationDispatchResponse> CreateAndSendAsync(CreateNotificationRequest request);
}

public class NotificationCommand : INotificationCommand
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IUserDeviceRepository _userDeviceRepository;
    private readonly IFirebaseCloudMessageService _firebaseCloudMessageService;
    private readonly ILogger<NotificationCommand> _logger;

    public NotificationCommand(
        INotificationRepository notificationRepository,
        IUserDeviceRepository userDeviceRepository,
        IFirebaseCloudMessageService firebaseCloudMessageService,
        ILogger<NotificationCommand> logger
    )
    {
        _notificationRepository = notificationRepository;
        _userDeviceRepository = userDeviceRepository;
        _firebaseCloudMessageService = firebaseCloudMessageService;
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

    public async Task<NotificationDispatchResponse> CreateAndSendAsync(CreateNotificationRequest request)
    {
        if (!Enum.TryParse<Models.NotificationType>(request.Type?.Trim(), true, out var parsedType))
        {
            throw new InvalidOperationException("Invalid notification type");
        }

        var notification = new Models.Notification
        {
            Id = Guid.NewGuid().ToString(),
            TargetUserId = request.TargetUserId.Trim(),
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            Type = parsedType,
            Payload = request.Payload ?? new Dictionary<string, object?>()
        };

        var created = await _notificationRepository.CreateAsync(notification);
        if (created == null)
        {
            throw new InvalidOperationException("Failed to create notification");
        }

        var devices = await _userDeviceRepository.FindActiveByUserIdAsync(created.TargetUserId);
        var tokens = devices
            .Select(x => x.DeviceToken)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var dispatch = await _firebaseCloudMessageService.SendAsync(created, tokens);

        _logger.LogInformation(
            "Notification {NotificationId} dispatched to {TokenCount} devices for user {UserId}",
            created.Id,
            dispatch.TotalTokens,
            created.TargetUserId
        );

        return new NotificationDispatchResponse
        {
            NotificationId = created.Id,
            TargetUserId = created.TargetUserId,
            Type = created.Type.ToString(),
            SentDate = created.SentDate,
            TotalTokens = dispatch.TotalTokens,
            SuccessCount = dispatch.SuccessCount,
            FailureCount = dispatch.FailureCount
        };
    }
}
