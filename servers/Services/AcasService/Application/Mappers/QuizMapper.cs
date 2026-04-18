using AcasService.Application.ResponseDTOs;

namespace AcasService.Application.Mappers;

public class QuizMapper
{
    public QuizResponse ToQuizResponse(Models.Quiz quiz)
    {
        return new QuizResponse
        {
            Id = quiz.Id,
            SubjectId = quiz.SubjectId,
            Title = quiz.Title,
            Duration = quiz.Duration,
            TotalQuestions = quiz.TotalQuestions,
            IsDeleted = quiz.IsDeleted,
            CreatedBy = quiz.CreatedBy,
            CreatedAt = quiz.CreatedAt,
            UpdatedAt = quiz.UpdatedAt,
            Questions = quiz.Questions.Select(ToQuizQuestionResponse).ToList()
        };
    }

    private static QuizQuestionResponse ToQuizQuestionResponse(Models.QuizQuestion question)
    {
        return new QuizQuestionResponse
        {
            QuizId = question.QuizId,
            QuestionId = question.QuestionId,
            Marks = question.Marks,
            DisplayOrder = question.DisplayOrder
        };
    }
}
