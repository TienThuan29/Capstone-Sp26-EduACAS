using Amazon.DynamoDBv2.Model;
using AcasService.Models;

namespace AcasService.Repositories.Problem;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ProblemToDynamoItem(Models.Problem problem)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = problem.Id },
            ["examId"] = new AttributeValue { S = problem.ExamId },
            ["lecturerId"] = new AttributeValue { S = problem.LecturerId },
            ["title"] = new AttributeValue { S = problem.Title },
            ["content"] = new AttributeValue { S = problem.Content },
            ["fileName"] = new AttributeValue { S = problem.FileName },
            ["mark"] = new AttributeValue { N = problem.Mark.ToString() },
            ["difficulty"] = new AttributeValue { S = problem.Difficulty.ToString() },
            ["codeTemplate"] = new AttributeValue { S = problem.CodeTemplate },
            ["createdDate"] = new AttributeValue { S = problem.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedDate"] = new AttributeValue { S = problem.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["isDeleted"] = new AttributeValue { BOOL = problem.IsDeleted }
        };

        return item;
    }

    public static Models.Problem DynamoItemToProblem(Dictionary<string, AttributeValue> item)
    {
        var problem = new Models.Problem
        {
            Id = item["id"].S,
            ExamId = item["examId"].S,
            LecturerId = item["lecturerId"].S,
            Title = item["title"].S,
            Content = item["content"].S,
            FileName = item["fileName"].S,
            Mark = float.Parse(item["mark"].N),
            Difficulty = Enum.Parse<Difficulty>(item["difficulty"].S),
            CodeTemplate = item["codeTemplate"].S,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = DateTime.Parse(item["updatedDate"].S),
            IsDeleted = item["isDeleted"].BOOL
        };

        return problem;
    }

    public static Dictionary<string, AttributeValue> TestCaseToDynamoItem(string problemId, TestCase testCase)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = testCase.Id },
            ["problemId"] = new AttributeValue { S = problemId },
            ["inputData"] = new AttributeValue { S = testCase.InputData },
            ["expectedOutput"] = new AttributeValue { S = testCase.ExpectedOutput },
            ["isPublic"] = new AttributeValue { BOOL = testCase.IsPublic },
            ["isCaseInsensitive"] = new AttributeValue { BOOL = testCase.IsCaseInsensitive },
            ["isRemovedSpace"] = new AttributeValue { BOOL = testCase.IsRemovedSpace },
            ["isDeleted"] = new AttributeValue { BOOL = testCase.IsDeleted }
        };

        return item;
    }

    public static TestCase DynamoItemToTestCase(Dictionary<string, AttributeValue> item)
    {
        var testCase = new TestCase
        {
            Id = item["id"].S,
            InputData = item["inputData"].S,
            ExpectedOutput = item["expectedOutput"].S,
            IsPublic = item["isPublic"].BOOL,
            IsCaseInsensitive = item["isCaseInsensitive"].BOOL,
            IsRemovedSpace = item["isRemovedSpace"].BOOL,
            IsDeleted = item["isDeleted"].BOOL
        };

        return testCase;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}