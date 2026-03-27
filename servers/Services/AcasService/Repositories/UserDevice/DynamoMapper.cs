using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.UserDevice;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> UserDeviceToDynamoItem(Models.UserDevice userDevice)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = userDevice.Id },
            ["userId"] = new AttributeValue { S = userDevice.UserId },
            ["deviceToken"] = new AttributeValue { S = userDevice.DeviceToken },
            ["platform"] = new AttributeValue { S = userDevice.Platform },
            ["isActive"] = new AttributeValue { BOOL = userDevice.IsActive }
        };

        if (!string.IsNullOrWhiteSpace(userDevice.DeviceId))
            item["deviceId"] = new AttributeValue { S = userDevice.DeviceId };

        if (!string.IsNullOrWhiteSpace(userDevice.AppVersion))
            item["appVersion"] = new AttributeValue { S = userDevice.AppVersion };

        if (userDevice.LastSeenAt.HasValue)
            item["lastSeenAt"] = new AttributeValue { S = userDevice.LastSeenAt.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

        if (userDevice.CreatedDate.HasValue)
            item["createdDate"] = new AttributeValue { S = userDevice.CreatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

        if (userDevice.UpdatedDate.HasValue)
            item["updatedDate"] = new AttributeValue { S = userDevice.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };

        return item;
    }

    public static Models.UserDevice DynamoItemToUserDevice(Dictionary<string, AttributeValue> item)
    {
        var userDevice = new Models.UserDevice
        {
            Id = item["id"].S,
            UserId = item["userId"].S,
            DeviceToken = item["deviceToken"].S,
            Platform = item.ContainsKey("platform") ? item["platform"].S : string.Empty,
            IsActive = !item.ContainsKey("isActive") || item["isActive"].BOOL
        };

        if (item.ContainsKey("deviceId"))
            userDevice.DeviceId = item["deviceId"].S ?? string.Empty;

        if (item.ContainsKey("appVersion"))
            userDevice.AppVersion = item["appVersion"].S ?? string.Empty;

        if (item.ContainsKey("lastSeenAt") && !string.IsNullOrWhiteSpace(item["lastSeenAt"].S))
            userDevice.LastSeenAt = DateTime.Parse(item["lastSeenAt"].S);

        if (item.ContainsKey("createdDate") && !string.IsNullOrWhiteSpace(item["createdDate"].S))
            userDevice.CreatedDate = DateTime.Parse(item["createdDate"].S);

        if (item.ContainsKey("updatedDate") && !string.IsNullOrWhiteSpace(item["updatedDate"].S))
            userDevice.UpdatedDate = DateTime.Parse(item["updatedDate"].S);

        return userDevice;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
