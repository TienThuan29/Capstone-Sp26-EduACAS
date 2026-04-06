using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class StudentExamSessionResponse
{
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;

    [JsonPropertyName("phase")]
    public string Phase { get; set; } = string.Empty;

    [JsonPropertyName("activeProblemId")]
    public string? ActiveProblemId { get; set; }

    [JsonPropertyName("lockReason")]
    public string? LockReason { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
}
