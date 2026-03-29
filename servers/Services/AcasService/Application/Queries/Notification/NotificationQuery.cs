using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Notification;

namespace AcasService.Application.Queries.Notification;

public interface INotificationQuery
{
    Task<List<NotificationResponse>> GetByTargetUserIdAsync(string targetUserId);
}

public class NotificationQuery : INotificationQuery
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationQuery(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<List<NotificationResponse>> GetByTargetUserIdAsync(string targetUserId)
    {
        var notifications = await _notificationRepository.FindByTargetUserIdAsync(targetUserId);

        return notifications.Select(x => new NotificationResponse
        {
            Id = x.Id,
            TargetUserId = x.TargetUserId,
            Title = x.Title,
            Body = x.Body,
            Type = x.Type.ToString(),
            Payload = x.Payload,
            SentDate = x.SentDate
        }).ToList();
    }
}
