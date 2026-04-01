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

    public async Task<List<Models.Notification>> FindByTargetUserIdAsync(string targetUserId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _notificationTableName,
                // Soft delete: if the item has isDeleted=true, exclude it.
                // For backward compatibility, treat missing isDeleted as false.
                FilterExpression =
                    "targetUserId = :targetUserId AND (attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse)",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":targetUserId"] = new AttributeValue { S = targetUserId },
                    [":isDeletedFalse"] = new AttributeValue { BOOL = false }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToNotification(item))
                .OrderByDescending(n => n.SentDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding notifications for user {TargetUserId}", targetUserId);
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
            throw;
        }
    }
}
