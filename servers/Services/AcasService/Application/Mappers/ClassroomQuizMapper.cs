using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ClassroomQuizMapper
{
    public ClassroomQuizResponse ToClassroomQuizResponse(ClassroomQuiz classroomQuiz)
    {
        var now = DateTime.UtcNow;
        var effectiveStatus = classroomQuiz.Status;

        if (classroomQuiz.Status != ClassroomQuizStatus.DRAFT)
        {
            if (now < classroomQuiz.StartTime)
            {
                effectiveStatus = ClassroomQuizStatus.PUBLISHED; 
            }
            else if (now > classroomQuiz.EndTime)
            {
                effectiveStatus = ClassroomQuizStatus.CLOSED;
            }
            else
            {
                effectiveStatus = ClassroomQuizStatus.ONGOING;
            }
        }

        return new ClassroomQuizResponse
        {
            Id = classroomQuiz.Id,
            ClassroomId = classroomQuiz.ClassroomId,
            QuizId = classroomQuiz.QuizId,
            StartTime = classroomQuiz.StartTime,
            EndTime = classroomQuiz.EndTime,
            MaxOfAttempts = classroomQuiz.MaxOfAttempts,
            Passcode = classroomQuiz.Passcode,
            Status = effectiveStatus,
            CreatedAt = classroomQuiz.CreatedAt,
            UpdatedAt = classroomQuiz.UpdatedAt
        };
    }
}
