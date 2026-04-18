using Amazon.DynamoDBv2.Model;
using AcasService.Models;

namespace AcasService.Repositories.ClassroomQuiz;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ClassroomQuizToDynamoItem(Models.ClassroomQuiz cq)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = cq.Id },
            ["classroomId"] = new AttributeValue { S = cq.ClassroomId },
            ["quizId"] = new AttributeValue { S = cq.QuizId },
            ["startTime"] = new AttributeValue { S = cq.StartTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["endTime"] = new AttributeValue { S = cq.EndTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["maxOfAttempts"] = new AttributeValue { N = cq.MaxOfAttempts.ToString() },
            ["passcode"] = cq.Passcode != null ? new AttributeValue { S = cq.Passcode } : new AttributeValue { NULL = true },
            ["status"] = new AttributeValue { S = cq.Status.ToString() },
            ["isDeleted"] = new AttributeValue { BOOL = cq.IsDeleted },
            ["createdBy"] = new AttributeValue { S = cq.CreatedBy },
            ["createdAt"] = new AttributeValue { S = cq.CreatedAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedAt"] = new AttributeValue { S = cq.UpdatedAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
    }

    public static Models.ClassroomQuiz DynamoItemToClassroomQuiz(Dictionary<string, AttributeValue> item)
    {
        return new Models.ClassroomQuiz
        {
            Id = item["id"].S,
            ClassroomId = item["classroomId"].S,
            QuizId = item["quizId"].S,
            StartTime = DateTime.Parse(item["startTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            EndTime = DateTime.Parse(item["endTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            MaxOfAttempts = int.Parse(item["maxOfAttempts"].N),
            Passcode = item.ContainsKey("passcode") && !item["passcode"].NULL ? item["passcode"].S : null,
            Status = Enum.Parse<ClassroomQuizStatus>(item["status"].S),
            IsDeleted = item["isDeleted"].BOOL,
            CreatedBy = item["createdBy"].S,
            CreatedAt = DateTime.Parse(item["createdAt"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            UpdatedAt = DateTime.Parse(item["updatedAt"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal)
        };
    }
}
