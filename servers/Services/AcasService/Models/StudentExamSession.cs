using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("StudentExamSessionTableName")]
public class StudentExamSession
{
    /// <summary>Composite key: {studentId}|{examId}</summary>
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string StudentId { get; set; } = string.Empty;

    [Required]
    public string ExamId { get; set; } = string.Empty;

    [Required]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    public StudentExamSessionPhase Phase { get; set; } = StudentExamSessionPhase.NotStarted;

    /// <summary>Last problem the student opened in the code editor (optional).</summary>
    public string? ActiveProblemId { get; set; }

    public string? LockReason { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime UpdatedDate { get; set; }

    public static string ComposeId(string studentId, string examId) => $"{studentId}|{examId}";
}

public enum StudentExamSessionPhase
{
    NotStarted = 0,
    Active = 1,
    Completed = 2,
    Locked = 3
}
