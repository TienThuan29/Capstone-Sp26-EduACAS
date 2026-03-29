using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class QuizAttemptResponse
{
    public string Id { get; set; } = string.Empty;
    public string ClassroomQuizId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public double? FinalScore { get; set; }
    public int AttemptNumber { get; set; }
}
