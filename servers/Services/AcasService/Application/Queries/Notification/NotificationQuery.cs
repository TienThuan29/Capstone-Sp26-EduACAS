using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Notification;

namespace AcasService.Application.Queries.Notification;

public interface INotificationQuery
{
    Task<PagedResult<NotificationResponse>> GetNotificationsByUserIdAsync(
        string userId,
        int pageIndex = 1,
        int pageSize = 10,
        bool? isRead = null);

    Task<List<NotificationResponse>> GetByTargetUserIdAsync(string targetUserId);

    Task<PagedResult<NotificationResponse>> GetAllNotificationsAsync(
        int pageIndex = 1, 
        int pageSize = 10,
        string? searchTerm = null);
}

public class NotificationQuery : INotificationQuery
{
    private readonly ILogger<NotificationQuery> _logger;
    private readonly INotificationRepository _notificationRepository;
    private readonly NotificationMapper _notificationMapper;

    public NotificationQuery(
        ILogger<NotificationQuery> logger,
        INotificationRepository notificationRepository,
        NotificationMapper notificationMapper)
    {
        _logger = logger;
        _notificationRepository = notificationRepository;
        _notificationMapper = notificationMapper;
    }

    public async Task<PagedResult<NotificationResponse>> GetNotificationsByUserIdAsync(
        string userId,
        int pageIndex = 1,
        int pageSize = 10,
        bool? isRead = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("userId is required", nameof(userId));

            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var all = await _notificationRepository.FindByTargetUserIdAsync(userId, isRead);
            var ordered = all
                .OrderBy(n => n.IsRead)
                .ThenByDescending(n => n.SentDate)
                .ToList();

            var totalCount = ordered.Count;
            var itemsOnPage = ordered
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var responses = itemsOnPage
                .Select(n => _notificationMapper.ToNotificationResponse(n))
                .ToList();

            return new PagedResult<NotificationResponse>(responses, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving notifications for user {UserId}", userId);
            throw;
        }
    }

    public async Task<List<NotificationResponse>> GetByTargetUserIdAsync(string targetUserId)
    {
        if (string.IsNullOrWhiteSpace(targetUserId))
            throw new ArgumentException("targetUserId is required", nameof(targetUserId));

        var notifications = await _notificationRepository.FindByTargetUserIdAsync(targetUserId);

        return notifications
            .OrderByDescending(n => n.SentDate)
            .Select(n => _notificationMapper.ToNotificationResponse(n))
            .ToList();
    }

    public async Task<PagedResult<NotificationResponse>> GetAllNotificationsAsync(
        int pageIndex = 1,
        int pageSize = 10,
        string? searchTerm = null)
    {
        try
        {
            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var (itemsOnPage, totalCount) = await _notificationRepository.SearchAsync(searchTerm, pageIndex, pageSize);

            var responses = itemsOnPage
                .Select(n => _notificationMapper.ToNotificationResponse(n))
                .ToList();

            return new PagedResult<NotificationResponse>(responses, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all notifications for admin with search term {SearchTerm}", searchTerm);
            throw;
        }
    }
}
