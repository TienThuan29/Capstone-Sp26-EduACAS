using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Notification;

public class NotificationRepository : DynamoRepository, INotificationRepository
{
    private readonly string _notificationTableName;
    private readonly ILogger<NotificationRepository> _logger;

    public NotificationRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<NotificationRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _logger = logger;
        _notificationTableName = configuration["DynamoDB:NotificationTableName"] ??
            throw new ArgumentNullException("DynamoDB:NotificationTableName is not configured");
        base.TableName = _notificationTableName;
    }

    public async Task<Models.Notification?> CreateAsync(Models.Notification notification)
    {
        try
        {
            notification.SentDate = DateTime.UtcNow;
            var item = DynamoMapper.NotificationToDynamoItem(notification);
            await PutItemAsync(item, _notificationTableName);
            return notification;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification");
            throw;
        }
    }

    public async Task<Models.Notification?> FindByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _notificationTableName);
            if (response.Item.Count == 0) return null;
            var notification = DynamoMapper.DynamoItemToNotification(response.Item);
            return notification.IsDeleted ? null : notification;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding notification {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.Notification>> FindByTargetUserIdAsync(string targetUserId, bool? isRead = null)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _notificationTableName,
                FilterExpression =
                    "targetUserId = :targetUserId AND (attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse)" +
                    (isRead.HasValue ? " AND isRead = :isRead" : ""),
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":targetUserId"] = new AttributeValue { S = targetUserId },
                    [":isDeletedFalse"] = new AttributeValue { BOOL = false }
                }
            };

            if (isRead.HasValue)
            {
                request.ExpressionAttributeValues[":isRead"] = new AttributeValue { BOOL = isRead.Value };
            }

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToNotification(item))
                .OrderByDescending(n => n.SentDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding notifications for user {TargetUserId} with isRead filter {IsRead}", targetUserId, isRead);
            throw;
        }
    }

    public async Task<Models.Notification?> UpdateAsync(Models.Notification notification)
    {
        try
        {
            var item = DynamoMapper.NotificationToDynamoItem(notification);
            await PutItemAsync(item, _notificationTableName);
            return notification;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification {Id}", notification.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _notificationTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification {Id}", id);
        }
    }

    public async Task<List<Models.Notification>> FindAllAsync()
    {
        try
        {
            var allItems = new List<Models.Notification>();
            Dictionary<string, AttributeValue>? lastKey = null;

            do
            {
                var request = new ScanRequest { TableName = _notificationTableName, ExclusiveStartKey = lastKey };
                var response = await _dynamoDBClient.ScanAsync(request);
                allItems.AddRange(response.Items.Select(item => DynamoMapper.DynamoItemToNotification(item)));
                lastKey = response.LastEvaluatedKey;
            } while (lastKey != null && lastKey.Count > 0);

            return allItems
                .OrderByDescending(n => n.SentDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning all notifications");
            throw;
        }
    }

    public async Task<(List<Models.Notification> Items, int TotalCount)> SearchAsync(string? searchTerm, int pageIndex, int pageSize)
    {
        try
        {
            var allItems = new List<Models.Notification>();
            Dictionary<string, AttributeValue>? lastKey = null;

            do
            {
                var request = new ScanRequest
                {
                    TableName = _notificationTableName,
                    ExclusiveStartKey = lastKey
                };

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var lowerSearch = searchTerm.ToLower();
                    request.FilterExpression =
                        "contains(#title, :search) OR contains(#body, :search) OR contains(#targetUserId, :search) OR contains(#type, :search)";
                    request.ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#title"] = "title",
                        ["#body"] = "body",
                        ["#targetUserId"] = "targetUserId",
                        ["#type"] = "type"
                    };
                    request.ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":search"] = new AttributeValue { S = lowerSearch }
                    };
                }

                var response = await _dynamoDBClient.ScanAsync(request);
                allItems.AddRange(response.Items.Select(item => DynamoMapper.DynamoItemToNotification(item)));
                lastKey = response.LastEvaluatedKey;
            } while (lastKey != null && lastKey.Count > 0);

            var ordered = allItems.OrderByDescending(n => n.SentDate).ToList();
            var totalCount = ordered.Count;
            var paged = ordered
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return (paged, totalCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching notifications with term {SearchTerm}", searchTerm);
            throw;
        }
    }
}
