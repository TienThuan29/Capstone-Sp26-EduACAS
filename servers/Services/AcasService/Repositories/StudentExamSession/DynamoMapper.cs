using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.StudentExamSession;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ToDynamoItem(Models.StudentExamSession s)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = s.Id },
            ["studentId"] = new AttributeValue { S = s.StudentId },
            ["examId"] = new AttributeValue { S = s.ExamId },
            ["classroomId"] = new AttributeValue { S = s.ClassroomId },
            ["phase"] = new AttributeValue { N = ((int)s.Phase).ToString() },
            ["createdDate"] = new AttributeValue { S = s.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedDate"] = new AttributeValue { S = s.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
        };
        if (!string.IsNullOrEmpty(s.ActiveProblemId))
            item["activeProblemId"] = new AttributeValue { S = s.ActiveProblemId };
        if (!string.IsNullOrEmpty(s.LockReason))
            item["lockReason"] = new AttributeValue { S = s.LockReason };
        return item;
    }

    public static Models.StudentExamSession FromDynamoItem(Dictionary<string, AttributeValue> item)
    {
        return new Models.StudentExamSession
        {
            Id = item["id"].S,
            StudentId = item["studentId"].S,
            ExamId = item["examId"].S,
            ClassroomId = item.ContainsKey("classroomId") ? item["classroomId"].S : string.Empty,
            Phase = item.ContainsKey("phase") && int.TryParse(item["phase"].N, out var p)
                ? (Models.StudentExamSessionPhase)p
                : Models.StudentExamSessionPhase.NotStarted,
            ActiveProblemId = item.TryGetValue("activeProblemId", out var ap) ? ap.S : null,
            LockReason = item.TryGetValue("lockReason", out var lr) ? lr.S : null,
            CreatedDate = item.ContainsKey("createdDate") ? DateTime.Parse(item["createdDate"].S) : DateTime.UtcNow,
            UpdatedDate = item.ContainsKey("updatedDate") ? DateTime.Parse(item["updatedDate"].S) : DateTime.UtcNow,
        };
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id) =>
        new() { ["id"] = new AttributeValue { S = id } };
}
