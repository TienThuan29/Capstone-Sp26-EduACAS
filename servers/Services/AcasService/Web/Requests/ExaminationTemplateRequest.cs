using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class ExamTempProblemRequest
{
    [Required]
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("mark")]
    public float Mark { get; set; }
}

public class ExaminationTemplateRequest
{
    [Required]
    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("lecturerId")]
    public string LecturerId { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("totalMark")]
    public float TotalMark { get; set; }

    [JsonPropertyName("problems")]
    public List<ExamTempProblemRequest>? Problems { get; set; }
}

public class UpdateExaminationTemplateRequest
{
    [Required]
    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("totalMark")]
    public float TotalMark { get; set; }

    [JsonPropertyName("problems")]
    public List<ExamTempProblemRequest>? Problems { get; set; }
}
