using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("ClassroomQuizTableName")]
public class ClassroomQuiz
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    public string QuizId { get; set; } = string.Empty;

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public int MaxOfAttempts { get; set; }

    [MaxLength(50)]
    public string? Passcode { get; set; }

    [Required]
    public ClassroomQuizStatus Status { get; set; }

    public bool IsDeleted { get; set; }

    [Required]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? OpenJobId { get; set; }
    
    public string? CloseJobId { get; set; }
}

public enum ClassroomQuizStatus
{
    DRAFT,
    PUBLISHED,
    CLOSED
}
