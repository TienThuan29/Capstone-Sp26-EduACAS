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
            ["codeTemplates"] = new AttributeValue { S = JsonSerializer.Serialize(problem.CodeTemplates ?? new Dictionary<string, string>()) },
            ["tags"] = new AttributeValue { S = JsonSerializer.Serialize(problem.Tags ?? Array.Empty<string>()) },
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

        Dictionary<string, string>? codeTemplates = null;
        if (item.TryGetValue("codeTemplates", out var codeTemplatesVal) && !string.IsNullOrEmpty(codeTemplatesVal.S))
        {
            codeTemplates = JsonSerializer.Deserialize<Dictionary<string, string>>(codeTemplatesVal.S);
        }
        // Backward compatibility: legacy single codeTemplate stored as string
        else if (item.TryGetValue("codeTemplate", out var legacyCodeTemplate) && !string.IsNullOrEmpty(legacyCodeTemplate.S))
        {
            codeTemplates = new Dictionary<string, string> { ["default"] = legacyCodeTemplate.S };
        }

        string[] tags = Array.Empty<string>();
        if (item.TryGetValue("tags", out var tagsVal) && !string.IsNullOrEmpty(tagsVal.S))
        {
            tags = JsonSerializer.Deserialize<string[]>(tagsVal.S) ?? Array.Empty<string>();
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
            CodeTemplates = codeTemplates,
            Tags = tags,
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