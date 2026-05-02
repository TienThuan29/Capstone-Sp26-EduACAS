using Amazon.DynamoDBv2.Model;
using System.Globalization;

namespace AcasService.Repositories.Quiz;

public static class DynamoMapper
{
	public static Dictionary<string, AttributeValue> QuizToDynamoItem(Models.Quiz quiz)
	{
		var item = new Dictionary<string, AttributeValue>
		{
			["id"] = new AttributeValue { S = quiz.Id },
			["subjectId"] = new AttributeValue { S = quiz.SubjectId },
			["title"] = new AttributeValue { S = quiz.Title },
			["duration"] = new AttributeValue { N = quiz.Duration.ToString() },
			["totalQuestions"] = new AttributeValue { N = quiz.TotalQuestions.ToString() },
			["isDeleted"] = new AttributeValue { BOOL = quiz.IsDeleted },
			["createdBy"] = new AttributeValue { S = quiz.CreatedBy },
			["createdAt"] = new AttributeValue { S = quiz.CreatedAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
			["updatedAt"] = new AttributeValue { S = quiz.UpdatedAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
		};

		if (quiz.Questions.Count > 0)
		{
			item["questions"] = new AttributeValue
			{
				L = quiz.Questions.Select(question => new AttributeValue
				{
					M = new Dictionary<string, AttributeValue>
					{
						["quizId"] = new AttributeValue { S = question.QuizId },
						["questionId"] = new AttributeValue { S = question.QuestionId },
						["marks"] = new AttributeValue { N = question.Marks.ToString(CultureInfo.InvariantCulture) },
						["displayOrder"] = new AttributeValue { N = question.DisplayOrder.ToString() }
					}
				}).ToList()
			};
		}

		return item;
	}

	public static Models.Quiz DynamoItemToQuiz(Dictionary<string, AttributeValue> item)
	{
		var quiz = new Models.Quiz
		{
			Id = item["id"].S,
			SubjectId = item["subjectId"].S,
			Title = item["title"].S,
			Duration = int.Parse(item["duration"].N),
			TotalQuestions = item.ContainsKey("totalQuestions") ? int.Parse(item["totalQuestions"].N) : 0,
			IsDeleted = item.ContainsKey("isDeleted") && item["isDeleted"].BOOL,
			CreatedBy = item["createdBy"].S,
			CreatedAt = DateTime.Parse(item["createdAt"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
			UpdatedAt = DateTime.Parse(item["updatedAt"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal)
		};

		if (item.TryGetValue("questions", out var questionsAttribute) && questionsAttribute.L != null)
		{
			quiz.Questions = questionsAttribute.L
				.Where(attribute => attribute.M != null)
				.Select(attribute => new Models.QuizQuestion
				{
					QuizId = attribute.M["quizId"].S,
					QuestionId = attribute.M["questionId"].S,
					Marks = double.Parse(attribute.M["marks"].N, CultureInfo.InvariantCulture),
					DisplayOrder = int.Parse(attribute.M["displayOrder"].N)
				})
				.ToList();
		}

		return quiz;
	}

	public static Dictionary<string, AttributeValue> CreateKey(string id)
	{
		return new Dictionary<string, AttributeValue>
		{
			["id"] = new AttributeValue { S = id }
		};
	}
}
