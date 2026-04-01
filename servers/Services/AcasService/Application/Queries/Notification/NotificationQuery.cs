using AcasService.Application.ResponseDTOs;
using AcasService.Application.Mappers;
using AcasService.Repositories.Notification;
using AcasService.Models;

namespace AcasService.Application.Queries.Notification;

public interface INotificationQuery
{
    Task<PagedResult<NotificationResponse>> GetNotificationsByUserIdAsync(
        string userId,
        int pageIndex = 1,
        int pageSize = 10);
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
        int pageSize = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("userId is required", nameof(userId));

            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var all = await _notificationRepository.FindByTargetUserIdAsync(userId);
            // Unread first, then by newest sent date.
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
}