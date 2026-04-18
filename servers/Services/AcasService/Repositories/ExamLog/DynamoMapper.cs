using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.ExamLog;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ExamLogToDynamoItem(Models.ExamLog examLog)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = examLog.Id },
            ["submissionId"] = new AttributeValue { S = examLog.SubmissionId },
            ["eventType"] = new AttributeValue { S = examLog.EventType.ToString() },
            ["eventDetail"] = new AttributeValue { S = examLog.EventDetail },
            ["message"] = new AttributeValue { S = examLog.Message },
            ["severity"] = new AttributeValue { S = examLog.Severity.ToString() },
            ["isViolation"] = new AttributeValue { BOOL = examLog.IsViolation },
            ["clientTimestamp"] = new AttributeValue { S = examLog.ClientTimestamp.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["createdDate"] = new AttributeValue { S = examLog.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
    }

    public static Models.ExamLog DynamoItemToExamLog(Dictionary<string, AttributeValue> item)
    {
        return new Models.ExamLog
        {
            Id = item["id"].S,
            SubmissionId = item["submissionId"].S,
            EventType = item.ContainsKey("eventType") && !string.IsNullOrWhiteSpace(item["eventType"].S)
                ? Enum.Parse<Models.ExamLogEventType>(item["eventType"].S, true)
                : Models.ExamLogEventType.OTHER,
            EventDetail = item.ContainsKey("eventDetail") ? item["eventDetail"].S : string.Empty,
            Message = item.ContainsKey("message") ? item["message"].S : string.Empty,
            Severity = item.ContainsKey("severity") && !string.IsNullOrWhiteSpace(item["severity"].S)
                ? Enum.Parse<Models.ExamLogSeverity>(item["severity"].S, true)
                : Models.ExamLogSeverity.INFO,
            IsViolation = item.ContainsKey("isViolation") && item["isViolation"].BOOL,
            ClientTimestamp = item.ContainsKey("clientTimestamp") && !string.IsNullOrWhiteSpace(item["clientTimestamp"].S)
                ? DateTime.Parse(item["clientTimestamp"].S)
                : DateTime.MinValue,
            CreatedDate = item.ContainsKey("createdDate") && !string.IsNullOrWhiteSpace(item["createdDate"].S)
                ? DateTime.Parse(item["createdDate"].S)
                : DateTime.MinValue
        };
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
