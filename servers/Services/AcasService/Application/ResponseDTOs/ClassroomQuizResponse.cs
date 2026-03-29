using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class ClassroomQuizResponse
{
    public string Id { get; set; } = string.Empty;
    public string ClassroomId { get; set; } = string.Empty;
    public string QuizId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int MaxOfAttempts { get; set; }
    public string? Passcode { get; set; }
    public ClassroomQuizStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
