using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.AnswerOption;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> AnswerOptionToDynamoItem(Models.AnswerOption option)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = option.Id },
            ["questionId"] = new AttributeValue { S = option.QuestionId },
            ["content"] = new AttributeValue { S = option.Content },
            ["isCorrect"] = new AttributeValue { BOOL = option.IsCorrect },
            ["createdAt"] = new AttributeValue { S = option.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedAt"] = new AttributeValue { S = option.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
    }

    public static Models.AnswerOption DynamoItemToAnswerOption(Dictionary<string, AttributeValue> item)
    {
        return new Models.AnswerOption
        {
            Id = item["id"].S,
            QuestionId = item["questionId"].S,
            Content = item["content"].S,
            IsCorrect = item["isCorrect"].BOOL,
            CreatedAt = DateTime.Parse(item["createdAt"].S),
            UpdatedAt = DateTime.Parse(item["updatedAt"].S)
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
