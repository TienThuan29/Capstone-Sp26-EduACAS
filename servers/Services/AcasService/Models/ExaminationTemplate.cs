using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("ExaminationTemplateTableName")]
public class ExaminationTemplate
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ExamName { get; set; } = string.Empty;

    [Required]
    public string LecturerId { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public float TotalMark { get; set; }

    public bool IsDeleted { get; set; }

    public List<ExamTempProblem> Problems { get; set; } = new List<ExamTempProblem>();

    public DateTime CreatedDate { get; set; }

    public DateTime? UpdatedDate { get; set; }
}

[DynamoDBEntity("ExamTempProblemTableName")]
public class ExamTempProblem
{
    [Required]
    public string ExamTempId { get; set; } = string.Empty;

    [Required]
    public string ProblemId { get; set; } = string.Empty;

    [Required]
    public float Mark { get; set; }
}
