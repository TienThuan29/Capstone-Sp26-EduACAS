using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("QuizAttemptTableName")]
public class QuizAttempt
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ClassroomQuizId { get; set; } = string.Empty;

    [Required]
    public string StudentId { get; set; } = string.Empty;

    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    [Required]
    public QuizAttemptStatus Status { get; set; }

    public double? FinalScore { get; set; }

    public int AttemptNumber { get; set; }  
}

public enum QuizAttemptStatus
{
    INPROGRESS,
    SUBMITTED,
    ABANDONED
}
