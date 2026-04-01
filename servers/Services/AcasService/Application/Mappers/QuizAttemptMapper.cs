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
            FinalScore = attempt.FinalScore,
            AttemptNumber = attempt.AttemptNumber
        };
    }
}
