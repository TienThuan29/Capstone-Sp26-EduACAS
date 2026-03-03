
using AcasService.Repositories.Notification;

namespace AcasService.Application.Commands.Notification;

public abstract class NotificationProviderBase
{
      protected readonly ILogger _logger;
      protected readonly INotificationRepository _notificationRepository;
      protected NotificationProviderBase(ILogger logger, INotificationRepository notificationRepository)
      {
            _logger = logger;
            _notificationRepository = notificationRepository;
      }

      // Template Method: Main function to send notification
      // This function contains the common logic that NEVER CHANGE
      public async Task<bool> SendAsync(Models.Notification notification)
      {
            try
            {
                  if (string.IsNullOrEmpty(notification.TargetUserId))
                        throw new ArgumentException("TargetUserId cannot be null.");
                        
                  // send notification to platform
                  bool result = await ExecuteSendAsync(notification);

                  if (result)
                        _logger.LogInformation($"Sent {notification.Type} to {notification.TargetUserId} via {this.GetType().Name}");

                  return result;
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, $"Failed to send notification to {notification.TargetUserId}");
                  return false;
            }
      }

      // Abstract Method: Must be implemented by the concrete classes (Web/Mobile notification)
      protected abstract Task<bool> ExecuteSendAsync(Models.Notification notification);
}