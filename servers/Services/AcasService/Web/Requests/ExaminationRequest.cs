using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class ExaminationProblemDTO
{
    [Required]
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("mark")]
    public float Mark { get; set; }
}

public class ExaminationRequestDTO
{
    [Required]
    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("programmingLanguageId")]
    public string ProgrammingLanguageId { get; set; } = string.Empty;

    [JsonPropertyName("problems")]
    public List<ExaminationProblemDTO>? Problems { get; set; }

    [Required]
    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("startDatetime")]
    public DateTime StartDatetime { get; set; }

    [Required]
    [JsonPropertyName("endDatetime")]
    public DateTime EndDatetime { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("isPublicResult")]
    public bool IsPublicResult { get; set; }

    [Required]
    [JsonPropertyName("totalMark")]
    public float TotalMark { get; set; }

    [Required]
    [JsonPropertyName("status")]
    [RegularExpression(@"^(PENDING|ONGOING|COMPLETED)$", ErrorMessage = "Status must be either PENDING, ONGOING, or COMPLETED")]
    public string Status { get; set; }

    [Required]
    [JsonPropertyName("mode")]
    [RegularExpression(@"^(PRACTICAL|EXAMINATION)$", ErrorMessage = "Mode must be either PRACTICAL or EXAMINATION")]
    public string Mode { get; set; }

    [JsonPropertyName("useStrict")]
    public bool UseStrict { get; set; }

    [JsonPropertyName("minScoreThreshold")]
    public float MinScoreThreshold { get; set; }

    [JsonPropertyName("maxAttempts")]
    public int? MaxAttempts { get; set; }
}
