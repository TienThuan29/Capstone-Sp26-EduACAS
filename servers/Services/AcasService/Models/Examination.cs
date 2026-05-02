using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("ExaminationTableName")]
public class Examination
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string ExamName { get; set; } = string.Empty;
    
    [Required]
    public string ProgrammingLanguageId { get; set; } = string.Empty;
    
    public List<ExaminationProblem> Problems { get; set; } = new List<ExaminationProblem>();
    
    [Required]
    public string ClassroomId { get; set; } = string.Empty;
    
    // [Required]
    // public string SlotId { get; set; } = string.Empty;
    
    [Required]
    public DateTime StartDatetime { get; set; }
    
    [Required]
    public DateTime EndDatetime { get; set; }
    
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public bool IsPublicResult { get; set; }
    
    [Required]
    public float TotalMark { get; set; }

    public int? MaxAttempts { get; set; }

    [Required]
    public Status Status { get; set; }
    
    [Required]
    public Mode Mode { get; set; }

    public bool UseStrict { get; set; }

    public float MinScoreThreshold { get; set; }
    
    public bool IsDeleted { get; set; }
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime UpdatedDate { get; set; }
}

public class ExaminationProblem
{
    [Required]
    public string ProblemId { get; set; } = string.Empty;
    
    [Required]
    public float Mark { get; set; }
}

public enum Mode
{
    PRACTICAL,
    EXAMINATION
}

public enum Status
{
    PENDING,
    ONGOING,
    COMPLETED
}