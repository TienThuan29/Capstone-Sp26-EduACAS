using AcasService.Application.ResponseDTOs;

namespace AcasService.Application.Mappers;

public class QuestionMapper
{
    public QuestionResponse ToQuestionResponse(Models.Question question)
    {
        return new QuestionResponse
        {
            Id = question.Id,
            Content = question.Content,
            ImageUrl = question.ImageUrl,
            Type = question.Type,
            TextAnswer = question.TextAnswer,
            IsDeleted = question.IsDeleted,
            CreatedBy = question.CreatedBy,
            CreatedAt = question.CreatedAt,
            UpdatedAt = question.UpdatedAt,
            AnswerOptions = question.AnswerOptions.Select(ToAnswerOptionResponse).ToList()
        };
    }

    private static AnswerOptionResponse ToAnswerOptionResponse(Models.AnswerOption option)
    {
        return new AnswerOptionResponse
        {
            Id = option.Id,
            QuestionId = option.QuestionId,
            Content = option.Content,
            IsCorrect = option.IsCorrect,
            CreatedAt = option.CreatedAt,
            UpdatedAt = option.UpdatedAt
        };
    }
}
