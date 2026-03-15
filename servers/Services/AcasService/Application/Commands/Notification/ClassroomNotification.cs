using AcasService.Repositories.Notification;
using AcasService.Web.Controllers.Notification;
using Microsoft.AspNetCore.SignalR;

namespace AcasService.Application.Commands.Notification;

public class ClassroomNotification : NotificationProviderBase
{
      private readonly IHubContext<NotificationHub> _hubContext;

      public ClassroomNotification(
          ILogger<ClassroomNotification> logger,
          INotificationRepository notificationRepository,
          IHubContext<NotificationHub> hubContext) : base(logger, notificationRepository)
      {
            _hubContext = hubContext;
      }

      protected override async Task<bool> ExecuteSendAsync(Models.Notification notification)
      {
            if (string.IsNullOrEmpty(notification.Id))
                  notification.Id = Guid.NewGuid().ToString();

            // var created = await _notificationRepository.CreateAsync(notification);
            var created = notification;
            if (created == null)
                  return false;

            await _hubContext.Clients
                .User(notification.TargetUserId)
                .SendAsync("ReceiveNotification", new
                {
                      created.Id,
                      created.TargetUserId,
                      created.Title,
                      created.Body,
                      created.Type,
                      created.Payload,
                      created.SentDate
                });

            return true;
      }
}