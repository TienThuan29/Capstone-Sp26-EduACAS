using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class ErrorGroupRequest
{
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("groupIds")]
    public List<string>? GroupIds { get; set; }
}
