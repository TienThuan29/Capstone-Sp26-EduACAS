using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ClassroomQuizMapper
{
    public ClassroomQuizResponse ToClassroomQuizResponse(ClassroomQuiz classroomQuiz)
    {
        return new ClassroomQuizResponse
        {
            Id = classroomQuiz.Id,
            ClassroomId = classroomQuiz.ClassroomId,
            QuizId = classroomQuiz.QuizId,
            StartTime = classroomQuiz.StartTime,
            EndTime = classroomQuiz.EndTime,
            MaxOfAttempts = classroomQuiz.MaxOfAttempts,
            Passcode = classroomQuiz.Passcode,
            Status = classroomQuiz.Status,
            CreatedAt = classroomQuiz.CreatedAt,
            UpdatedAt = classroomQuiz.UpdatedAt
        };
    }
}
