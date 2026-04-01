using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.StudentAnswer;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> StudentAnswerToDynamoItem(Models.StudentAnswer answer)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = answer.Id },
            ["attemptId"] = new AttributeValue { S = answer.AttemptId },
            ["questionId"] = new AttributeValue { S = answer.QuestionId },
            ["isCorrect"] = new AttributeValue { BOOL = answer.IsCorrect }
        };

        if (!string.IsNullOrEmpty(answer.AnswerOptionId))
            item["answerOptionId"] = new AttributeValue { S = answer.AnswerOptionId };
        
        if (!string.IsNullOrEmpty(answer.TextAnswer))
            item["textAnswer"] = new AttributeValue { S = answer.TextAnswer };

        return item;
    }

    public static Models.StudentAnswer DynamoItemToStudentAnswer(Dictionary<string, AttributeValue> item)
    {
        return new Models.StudentAnswer
        {
            Id = item["id"].S,
            AttemptId = item["attemptId"].S,
            QuestionId = item["questionId"].S,
            AnswerOptionId = item.ContainsKey("answerOptionId") ? item["answerOptionId"].S : null,
            TextAnswer = item.ContainsKey("textAnswer") ? item["textAnswer"].S : null,
            IsCorrect = item["isCorrect"].BOOL
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
