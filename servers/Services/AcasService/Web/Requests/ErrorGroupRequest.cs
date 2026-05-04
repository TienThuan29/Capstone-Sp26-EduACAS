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

    [JsonPropertyName("minTokenMatch")]
    public int? MinTokenMatch { get; set; }

    [JsonPropertyName("minSimilarity")]
    public double? MinSimilarity { get; set; }

    [JsonPropertyName("excludeBaseCode")]
    public bool? ExcludeBaseCode { get; set; }
}
