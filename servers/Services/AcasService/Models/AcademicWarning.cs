using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("AcademicWarningTableName")]
public class AcademicWarning
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    public string StudentId { get; set; } = string.Empty;

    [Required]
    public string ExamId { get; set; } = string.Empty;

    [Required]
    public string ProblemId { get; set; } = string.Empty;

    public int WarningLevel { get; set; }

    [Required]
    public AcademicWarningTriggerType TriggerType { get; set; }

    public InvolvedExamsInfo InvolvedExams { get; set; } = new();

    public Dictionary<string, AcademicWarningAnalysisEntry> LlmAnalysis { get; set; } = new();

    public Dictionary<string, AcademicWarningAnalysisEntry> LecturerAnalysis { get; set; } = new();

    public DateTime SentDate { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedDate { get; set; }

    public DateTime UpdatedDate { get; set; }
}

public class InvolvedExamsInfo
{
    public Dictionary<string, float> ExamScores { get; set; } = new();

    public float AverageScore { get; set; }
}

public class AcademicWarningAnalysisEntry
{
    public string SubmissionId { get; set; } = string.Empty;

    public string Analysis { get; set; } = string.Empty;

    public string Recomendation { get; set; } = string.Empty;
}

public enum AcademicWarningTriggerType
{
    SINGLE_EXAM_LOW_SCORE,
    AVERAGE_EXAM_LOW_SCORE,
}
