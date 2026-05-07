using System.Text.Json;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.AcademicWarning;

public static class DynamoMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static Dictionary<string, AttributeValue> AcademicWarningToDynamoItem(Models.AcademicWarning academicWarning)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = academicWarning.Id },
            ["classroomId"] = new AttributeValue { S = academicWarning.ClassroomId },
            ["studentId"] = new AttributeValue { S = academicWarning.StudentId },
            ["examId"] = new AttributeValue { S = academicWarning.ExamId },
            ["problemId"] = new AttributeValue { S = academicWarning.ProblemId },
            ["warningLevel"] = new AttributeValue { N = academicWarning.WarningLevel.ToString() },
            ["triggerType"] = new AttributeValue { S = academicWarning.TriggerType.ToString() },
            ["sentDate"] = new AttributeValue { S = academicWarning.SentDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["isRead"] = new AttributeValue { BOOL = academicWarning.IsRead },
            ["createdDate"] = new AttributeValue { S = academicWarning.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedDate"] = new AttributeValue { S = academicWarning.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };

        if (academicWarning.InvolvedExams != null)
        {
            item["involvedExams"] = new AttributeValue
            {
                S = JsonSerializer.Serialize(academicWarning.InvolvedExams, JsonOptions)
            };
        }

        if (academicWarning.LlmAnalysis != null && academicWarning.LlmAnalysis.Count > 0)
        {
            item["llmAnalysis"] = new AttributeValue
            {
                S = JsonSerializer.Serialize(academicWarning.LlmAnalysis, JsonOptions)
            };
        }

        if (academicWarning.LecturerAnalysis != null && academicWarning.LecturerAnalysis.Count > 0)
        {
            item["lecturerAnalysis"] = new AttributeValue
            {
                S = JsonSerializer.Serialize(academicWarning.LecturerAnalysis, JsonOptions)
            };
        }

        return item;
    }

    public static Models.AcademicWarning DynamoItemToAcademicWarning(Dictionary<string, AttributeValue> item)
    {
        var academicWarning = new Models.AcademicWarning
        {
            Id = item["id"].S,
            ClassroomId = item["classroomId"].S,
            StudentId = item["studentId"].S,
            ExamId = item.TryGetValue("examId", out var examIdVal) ? examIdVal.S : string.Empty,
            ProblemId = item.TryGetValue("problemId", out var problemIdVal) ? problemIdVal.S : string.Empty,
            WarningLevel = int.Parse(item["warningLevel"].N),
            TriggerType = Enum.Parse<Models.AcademicWarningTriggerType>(item["triggerType"].S),
            SentDate = DateTime.Parse(item["sentDate"].S),
            IsRead = item.ContainsKey("isRead") ? item["isRead"].BOOL : false,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = DateTime.Parse(item["updatedDate"].S)
        };

        if (item.TryGetValue("involvedExams", out var involvedExamsVal) && !string.IsNullOrEmpty(involvedExamsVal.S))
        {
            academicWarning.InvolvedExams = JsonSerializer.Deserialize<Models.InvolvedExamsInfo>(involvedExamsVal.S, JsonOptions)
                ?? new Models.InvolvedExamsInfo();
        }

        if (item.TryGetValue("llmAnalysis", out var llmAnalysisVal) && !string.IsNullOrEmpty(llmAnalysisVal.S))
        {
            academicWarning.LlmAnalysis = JsonSerializer.Deserialize<Dictionary<string, Models.AcademicWarningAnalysisEntry>>(llmAnalysisVal.S, JsonOptions)
                ?? new Dictionary<string, Models.AcademicWarningAnalysisEntry>();
        }

        if (item.TryGetValue("lecturerAnalysis", out var lecturerAnalysisVal) && !string.IsNullOrEmpty(lecturerAnalysisVal.S))
        {
            academicWarning.LecturerAnalysis = JsonSerializer.Deserialize<Dictionary<string, Models.AcademicWarningAnalysisEntry>>(lecturerAnalysisVal.S, JsonOptions)
                ?? new Dictionary<string, Models.AcademicWarningAnalysisEntry>();
        }

        return academicWarning;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
