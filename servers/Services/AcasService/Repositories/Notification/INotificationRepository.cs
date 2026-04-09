namespace AcasService.Repositories.Notification;

public interface INotificationRepository
{
    Task<Models.Notification?> CreateAsync(Models.Notification notification);
    Task<Models.Notification?> FindByIdAsync(string id);
    Task<List<Models.Notification>> FindByTargetUserIdAsync(string targetUserId);
    Task<List<Models.Notification>> FindAllAsync();
    Task<Models.Notification?> UpdateAsync(Models.Notification notification);
    Task DeleteAsync(string id);
}
