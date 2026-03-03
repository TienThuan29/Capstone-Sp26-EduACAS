using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class SubmitProblemRequest
{
    [Required]
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("languageId")]
    public string LanguageId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("compilerId")]
    public string CompilerId { get; set; } = string.Empty;
}