using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Question;

public static class DynamoMapper
{
	public static Dictionary<string, AttributeValue> QuestionToDynamoItem(Models.Question question)
	{
		var item = new Dictionary<string, AttributeValue>
		{
			["id"] = new AttributeValue { S = question.Id },
			["content"] = new AttributeValue { S = question.Content },
			["type"] = new AttributeValue { S = question.Type.ToString() },
			["isDeleted"] = new AttributeValue { BOOL = question.IsDeleted },
			["createdBy"] = new AttributeValue { S = question.CreatedBy },
			["createdAt"] = new AttributeValue { S = question.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
			["updatedAt"] = new AttributeValue { S = question.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
		};

		if (!string.IsNullOrWhiteSpace(question.ImageUrl))
		{
			item["imageUrl"] = new AttributeValue { S = question.ImageUrl };
		}

		if (!string.IsNullOrWhiteSpace(question.TextAnswer))
		{
			item["textAnswer"] = new AttributeValue { S = question.TextAnswer };
		}

		return item;
	}

	public static Models.Question DynamoItemToQuestion(Dictionary<string, AttributeValue> item)
	{
		var question = new Models.Question
		{
			Id = item["id"].S,
			Content = item["content"].S,
			ImageUrl = item.ContainsKey("imageUrl") ? item["imageUrl"].S : null,
			Type = Enum.TryParse<Models.QuestionType>(item["type"].S, true, out var type)
				? type
				: Models.QuestionType.SINGLE_CHOICE,
			TextAnswer = item.ContainsKey("textAnswer") ? item["textAnswer"].S : null,
			IsDeleted = item.ContainsKey("isDeleted") && item["isDeleted"].BOOL,
			CreatedBy = item["createdBy"].S,
			CreatedAt = DateTime.Parse(item["createdAt"].S),
			UpdatedAt = DateTime.Parse(item["updatedAt"].S)
		};

		if (item.TryGetValue("answerOptions", out var answerOptionsAttribute) && answerOptionsAttribute.L != null)
		{
			question.AnswerOptions = answerOptionsAttribute.L
				.Where(attribute => attribute.M != null)
				.Select(attribute => new Models.AnswerOption
				{
					Id = attribute.M["id"].S,
					QuestionId = attribute.M["questionId"].S,
					Content = attribute.M["content"].S,
					IsCorrect = attribute.M["isCorrect"].BOOL,
					CreatedAt = DateTime.Parse(attribute.M["createdAt"].S),
					UpdatedAt = DateTime.Parse(attribute.M["updatedAt"].S)
				})
				.ToList();
		}

		return question;
	}

	public static Dictionary<string, AttributeValue> CreateKey(string id)
	{
		return new Dictionary<string, AttributeValue>
		{
			["id"] = new AttributeValue { S = id }
		};
	}
}
