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

    public StudentQuizQuestionResponse ToStudentQuizQuestionResponse(QuizQuestion quizQuestion, Question question)
    {
        var result = new StudentQuizQuestionResponse
        {
            Id = question.Id,
            QuestionId = question.Id,
            Content = question.Content,
            Marks = quizQuestion.Marks,
            DisplayOrder = quizQuestion.DisplayOrder
        };

        if (question.AnswerOptions != null)
        {
            result.Options = question.AnswerOptions
                .OrderBy(o => o.CreatedAt)
                .Select(o => new StudentAnswerOptionResponse
                {
                    Id = o.Id,
                    Content = o.Content
                }).ToList();
        }

        return result;
    }
}
