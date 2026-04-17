namespace AcasService.Repositories.Notification;

public interface INotificationRepository
{
    Task<Models.Notification?> CreateAsync(Models.Notification notification);
    Task<Models.Notification?> FindByIdAsync(string id);
    Task<List<Models.Notification>> FindByTargetUserIdAsync(string targetUserId);
    Task<List<Models.Notification>> FindAllAsync();
    Task<(List<Models.Notification> Items, int TotalCount)> SearchAsync(string? searchTerm, int pageIndex, int pageSize);
    Task<Models.Notification?> UpdateAsync(Models.Notification notification);
    Task DeleteAsync(string id);
}
