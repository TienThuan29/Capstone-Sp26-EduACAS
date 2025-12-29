using System;
using System.ComponentModel.DataAnnotations;
using AcasService.Models;



namespace AcasService.Web.Requests;


public class ExaminationRequestDTO
{
    [Required]
    public string ExamName { get; set; } = string.Empty;

    [Required]
    public string ProgrammingLanguageId { get; set; } = string.Empty;

    public string[] ProblemIds { get; set; } = Array.Empty<string>();

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
    public Status Status { get; set; }

    [Required]
    public Mode Mode { get; set; }
}
