using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;



namespace AcasService.Web.Requests;

public class ExaminationProblemDTO
{
    [Required]
    public string ProblemId { get; set; } = string.Empty;

    [Required]
    public float Mark { get; set; }
}

public class ExaminationRequestDTO
{
    [Required]
    public string ExamName { get; set; } = string.Empty;

    [Required]
    public string ProgrammingLanguageId { get; set; } = string.Empty;

    public List<ExaminationProblemDTO> Problems { get; set; } = new();

    [Required]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    public DateTime StartDatetime { get; set; }

    [Required]
    public DateTime EndDatetime { get; set; }

    public string Description { get; set; } = string.Empty;

    [Required]
    public bool IsPublicResult { get; set; }

    [Required]
    public float TotalMark { get; set; }

    [Required]
    [RegularExpression(@"^(PENDING|ONGOING|COMPLETED)$", ErrorMessage = "Status must be either PENDING, ONGOING, or COMPLETED")]
    public string Status { get; set; }

    [Required]
    [RegularExpression(@"^(PRACTICAL|EXAMINATION)$", ErrorMessage = "Mode must be either PRACTICAL or EXAMINATION")]
    public string Mode { get; set; }
}
