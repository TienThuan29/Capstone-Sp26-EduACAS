using Amazon.DynamoDBv2.Model;
using System.Text.Json;
using AcasService.Models;

namespace AcasService.Repositories.ErrorGroup;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ErrorGroupToDynamoItem(Models.ErrorGroup errorGroup)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = errorGroup.Id },
            ["problemId"] = new AttributeValue { S = errorGroup.ProblemId },
            ["examId"] = new AttributeValue { S = errorGroup.ExamId },
            ["errorSignature"] = new AttributeValue { S = errorGroup.ErrorSignature },
            ["jPlagStatus"] = new AttributeValue { S = errorGroup.JPlagStatus.ToString() },
            ["submissionIds"] = new AttributeValue { SS = errorGroup.SubmissionIds.Count > 0 ? errorGroup.SubmissionIds : new List<string> { "empty" } }, // SS cannot be empty in DynamoDB
            ["jPlagResults"] = new AttributeValue { S = JsonSerializer.Serialize(errorGroup.JPlagResults) },
            ["createdDate"] = new AttributeValue { S = errorGroup.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
    }

    public static Models.ErrorGroup DynamoItemToErrorGroup(Dictionary<string, AttributeValue> item)
    {
        var submissionIds = new List<string>();
        if (item.TryGetValue("submissionIds", out var ssVal) && ssVal.SS != null)
        {
            submissionIds = ssVal.SS.Where(id => id != "empty").ToList();
        }

        return new Models.ErrorGroup
        {
            Id = item["id"].S,
            ProblemId = item["problemId"].S,
            ExamId = item["examId"].S,
            ErrorSignature = item["errorSignature"].S,
            JPlagStatus = Enum.Parse<JPlagStatus>(item["jPlagStatus"].S),
            SubmissionIds = submissionIds,
            JPlagResults = JsonSerializer.Deserialize<List<JPlagMatch>>(item["jPlagResults"].S) ?? new(),
            CreatedDate = DateTime.Parse(item["createdDate"].S)
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
