using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Web.Requests;

public class CacheKeystrokeLogsRequest
{
    [Required]
    [JsonPropertyName("examinationId")]
    public string ExaminationId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("keystroke_data")]
    public List<KeystrokeRecord> KeystrokeData { get; set; } = new List<KeystrokeRecord>();
}

public class FlushKeystrokeLogsRequest
{
    [Required]
    [JsonPropertyName("submissionId")]
    public string SubmissionId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("examinationId")]
    public string ExaminationId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("keystroke_data")]
    public List<KeystrokeRecord> KeystrokeData { get; set; } = new List<KeystrokeRecord>();
}
