using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class QuizAttemptMapper
{
    public QuizAttemptResponse ToQuizAttemptResponse(QuizAttempt attempt)
    {
        return new QuizAttemptResponse
        {
            Id = attempt.Id,
            ClassroomQuizId = attempt.ClassroomQuizId,
            StudentId = attempt.StudentId,
            StartTime = attempt.StartTime,
            EndTime = attempt.EndTime,
            Status = attempt.Status,
            Score = attempt.FinalScore,
            AttemptNumber = attempt.AttemptNumber
        };
    }

    public StudentQuizQuestionResponse ToStudentQuizQuestionResponse(QuizQuestion quizQuestion, Question question, bool showCorrect = false)
    {
        var result = new StudentQuizQuestionResponse
        {
            Id = question.Id,
            QuestionId = question.Id,
            Content = question.Content,
            Type = question.Type,
            TextAnswer = question.TextAnswer,
            CorrectCount = question.AnswerOptions?.Count(o => o.IsCorrect) ?? 0,
            Marks = quizQuestion.Marks,
            DisplayOrder = quizQuestion.DisplayOrder
        };

        if (question.AnswerOptions != null)
        {
            result.Options = question.AnswerOptions
                .OrderBy(o => o.CreatedAt)
                .GroupBy(o => o.Id)
                .Select(g => g.First())
                .Select(o => new StudentAnswerOptionResponse
                {
                    Id = o.Id,
                    Content = o.Content,
                    IsCorrect = showCorrect ? o.IsCorrect : false
                }).ToList();
        }

        return result;
    }
}
