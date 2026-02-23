using System.Text.Json;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Notification;

public static class DynamoMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static Dictionary<string, AttributeValue> NotificationToDynamoItem(Models.Notification notification)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = notification.Id },
            ["targetUserId"] = new AttributeValue { S = notification.TargetUserId },
            ["title"] = new AttributeValue { S = notification.Title },
            ["body"] = new AttributeValue { S = notification.Body },
            ["type"] = new AttributeValue { S = notification.Type.ToString() },
            ["sentDate"] = new AttributeValue { S = notification.SentDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };

        if (notification.Payload != null && notification.Payload.Count > 0)
        {
            item["payload"] = new AttributeValue { S = JsonSerializer.Serialize(notification.Payload, JsonOptions) };
        }

        return item;
    }

    public static Models.Notification DynamoItemToNotification(Dictionary<string, AttributeValue> item)
    {
        var notification = new Models.Notification
        {
            Id = item["id"].S,
            TargetUserId = item["targetUserId"].S,
            Title = item["title"].S,
            Body = item["body"].S,
            Type = Enum.Parse<Models.NotificationType>(item["type"].S),
            SentDate = DateTime.Parse(item["sentDate"].S)
        };

        if (item.ContainsKey("payload") && !string.IsNullOrEmpty(item["payload"].S))
        {
            var payload = JsonSerializer.Deserialize<Dictionary<string, object?>>(item["payload"].S, JsonOptions);
            notification.Payload = payload ?? new Dictionary<string, object?>();
        }

        return notification;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
