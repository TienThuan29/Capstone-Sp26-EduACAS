using Amazon.DynamoDBv2.Model;
using System.Text.Json;

namespace AcasService.Repositories.KeystrokeLogs;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ToDynamoItem(Models.KeystrokeLog keystrokeLog)
    {
        var keystrokeDataJson = keystrokeLog.KeystrokeData.Count > 0
            ? JsonSerializer.Serialize(keystrokeLog.KeystrokeData)
            : "[]";

        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = keystrokeLog.Id },
            ["submissionId"] = new AttributeValue { S = keystrokeLog.SubmissionId },
            ["keystrokeData"] = new AttributeValue { S = keystrokeDataJson },
            ["createdDate"] = new AttributeValue { S = keystrokeLog.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
    }

    public static Models.KeystrokeLog ToEntity(Dictionary<string, AttributeValue> item)
    {
        var keystrokeData = new List<Models.KeystrokeRecord>();
        if (item.TryGetValue("keystrokeData", out var keystrokeDataValue) && !string.IsNullOrEmpty(keystrokeDataValue.S))
        {
            keystrokeData = JsonSerializer.Deserialize<List<Models.KeystrokeRecord>>(keystrokeDataValue.S) ?? [];
        }

        var createdDateRaw = item.ContainsKey("createdDate") && !string.IsNullOrEmpty(item["createdDate"].S)
            ? item["createdDate"].S
            : item.ContainsKey("createdAt") && !string.IsNullOrEmpty(item["createdAt"].S)
                ? item["createdAt"].S
                : string.Empty;

        return new Models.KeystrokeLog
        {
            Id = item["id"].S,
            SubmissionId = item.ContainsKey("submissionId") ? item["submissionId"].S : string.Empty,
            KeystrokeData = keystrokeData,
            CreatedDate = !string.IsNullOrEmpty(createdDateRaw)
                ? DateTime.Parse(createdDateRaw)
                : DateTime.UtcNow
        };
    }
}
