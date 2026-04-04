using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class ExaminationTemplateResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("lecturerId")]
    public string LecturerId { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("totalMark")]
    public float TotalMark { get; set; }

    [JsonPropertyName("problems")]
    public List<ExamTempProblemResponse> Problems { get; set; } = new();

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime? UpdatedDate { get; set; }
}

public class ExamTempProblemResponse
{
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("mark")]
    public float Mark { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
}
