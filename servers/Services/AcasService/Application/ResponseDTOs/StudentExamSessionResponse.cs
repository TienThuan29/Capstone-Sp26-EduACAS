using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class StudentExamSessionResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("studentName")]
    public string StudentName { get; set; } = string.Empty;

    [JsonPropertyName("studentRoleNumber")]
    public string StudentRoleNumber { get; set; } = string.Empty;

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

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
}
