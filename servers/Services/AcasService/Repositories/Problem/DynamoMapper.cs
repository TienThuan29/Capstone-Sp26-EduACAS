using Amazon.DynamoDBv2.Model;
using AcasService.Models;
using System.Text.Json;

namespace AcasService.Repositories.Problem;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ProblemToDynamoItem(Models.Problem problem)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = problem.Id },
            ["lecturerId"] = new AttributeValue { S = problem.LecturerId },
            ["title"] = new AttributeValue { S = problem.Title },
            ["content"] = new AttributeValue { S = problem.Content },
            ["fileName"] = new AttributeValue { S = problem.FileName },
            ["difficulty"] = new AttributeValue { S = problem.Difficulty.ToString() },
            ["codeTemplate"] = new AttributeValue { S = problem.CodeTemplate },
            ["createdDate"] = new AttributeValue { S = problem.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedDate"] = new AttributeValue { S = problem.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["isDeleted"] = new AttributeValue { BOOL = problem.IsDeleted },
            ["testCases"] = new AttributeValue { S = JsonSerializer.Serialize(problem.TestCases) }
        };

        return item;
    }

    public static Models.Problem DynamoItemToProblem(Dictionary<string, AttributeValue> item)
    {
        var testCases = new List<TestCase>();
        if (item.TryGetValue("testCases", out var value) && !string.IsNullOrEmpty(value.S))
        {
            testCases = JsonSerializer.Deserialize<List<TestCase>>(value.S) ?? [];
        }

        var problem = new Models.Problem
        {
            Id = item["id"].S,
            LecturerId = item["lecturerId"].S,
            Title = item["title"].S,
            Content = item["content"].S,
            FileName = item["fileName"].S,
            // Mark = float.Parse(item["mark"].N),
            Difficulty = Enum.Parse<Difficulty>(item["difficulty"].S),
            CodeTemplate = item["codeTemplate"].S,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = DateTime.Parse(item["updatedDate"].S),
            IsDeleted = item["isDeleted"].BOOL,
            TestCases = testCases
        };

        return problem;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}