using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class NotificationMapper
{
    public NotificationResponse ToNotificationResponse(Notification notification)
    {
        return new NotificationResponse
        {
            Id = notification.Id,
            TargetUserId = notification.TargetUserId,
            Title = notification.Title,
            Body = notification.Body,
            Type = notification.Type,
            Payload = notification.Payload,
            SentDate = notification.SentDate,
            IsRead = notification.IsRead,
            IsDeleted = notification.IsDeleted
        };
    }
}

