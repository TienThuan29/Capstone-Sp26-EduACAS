using Amazon.DynamoDBv2.Model;
using System.Text.Json;

namespace AcasService.Repositories.Submission;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> SubmissionToDynamoItem(Models.Submission submission)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = submission.Id },
            ["studentId"] = new AttributeValue { S = submission.StudentId },
            ["examId"] = new AttributeValue { S = submission.ExamId },
            ["problemId"] = new AttributeValue { S = submission.ProblemId },
            ["languageId"] = new AttributeValue { S = submission.LanguageId },
            ["compilerId"] = new AttributeValue { S = submission.CompilerId },
            ["source"] = new AttributeValue { S = submission.Source },
            ["version"] = new AttributeValue { N = submission.Version.ToString() },
            ["submittedDate"] = new AttributeValue { S = submission.SubmittedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["finalScore"] = new AttributeValue { N = submission.FinalScore.ToString(System.Globalization.CultureInfo.InvariantCulture) },
            ["status"] = new AttributeValue { S = submission.Status.ToString() },
            ["gradedDate"] = new AttributeValue { S = submission.GradedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["regradingRequestId"] = new AttributeValue { S = submission.RegradingRequestId },
            ["lecturerFeedback"] = new AttributeValue { S = submission.LecturerFeedback },
            ["aiFeedback"] = new AttributeValue { S = submission.AiFeedback },
            ["updatedDate"] = new AttributeValue { S = submission.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };

        if (submission.TestResults != null && submission.TestResults.Count > 0)
        {
            item["testResults"] = new AttributeValue { S = JsonSerializer.Serialize(submission.TestResults) };
        }

        return item;
    }

    public static Models.Submission DynamoItemToSubmission(Dictionary<string, AttributeValue> item)
    {
        var testResults = new List<Models.TestResult>();
        if (item.TryGetValue("testResults", out var testResultsVal) && !string.IsNullOrEmpty(testResultsVal.S))
        {
            testResults = JsonSerializer.Deserialize<List<Models.TestResult>>(testResultsVal.S) ?? [];
        }

        return new Models.Submission
        {
            Id = item["id"].S,
            StudentId = item["studentId"].S,
            ExamId = item["examId"].S,
            ProblemId = item["problemId"].S,
            LanguageId = item["languageId"].S,
            CompilerId = item["compilerId"].S,
            Source = item["source"].S,
            Version = int.Parse(item["version"].N),
            SubmittedDate = DateTime.Parse(item["submittedDate"].S),
            FinalScore = float.Parse(item["finalScore"].N, System.Globalization.CultureInfo.InvariantCulture),
            Status = item.ContainsKey("status") && !string.IsNullOrEmpty(item["status"].S)
                ? Enum.Parse<Models.SubmissionStatus>(item["status"].S)
                : (item.ContainsKey("isGraded") && item["isGraded"].BOOL ? Models.SubmissionStatus.GRADED : Models.SubmissionStatus.PENDING),
            GradedDate = item.ContainsKey("gradedDate") && !string.IsNullOrEmpty(item["gradedDate"].S)
                ? DateTime.Parse(item["gradedDate"].S)
                : DateTime.MinValue,
            RegradingRequestId = item.ContainsKey("regradingRequestId") ? item["regradingRequestId"].S : string.Empty,
            LecturerFeedback = item.ContainsKey("lecturerFeedback") ? item["lecturerFeedback"].S : string.Empty,
            AiFeedback = item.ContainsKey("aiFeedback") ? item["aiFeedback"].S : string.Empty,
            UpdatedDate = DateTime.Parse(item["updatedDate"].S),
            TestResults = testResults
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