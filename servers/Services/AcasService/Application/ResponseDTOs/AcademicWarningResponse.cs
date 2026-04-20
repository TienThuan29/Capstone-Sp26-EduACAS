using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class AcademicWarningResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;
    [JsonPropertyName("warningLevel")]
    public int WarningLevel { get; set; }
    [JsonPropertyName("triggerType")]
    public string TriggerType { get; set; } = string.Empty;
    [JsonPropertyName("sentDate")]
    public DateTime SentDate { get; set; }
    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; }
    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }
    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
    [JsonPropertyName("involvedExams")]
    public InvolvedExamsInfoDto? InvolvedExams { get; set; }
    [JsonPropertyName("llmAnalysis")]
    public Dictionary<string, AnalysisEntryDto> LlmAnalysis { get; set; } = new();
    [JsonPropertyName("lecturerAnalysis")]
    public Dictionary<string, AnalysisEntryDto> LecturerAnalysis { get; set; } = new();
}

public class InvolvedExamsInfoDto
{
    [JsonPropertyName("examScores")]
    public Dictionary<string, float> ExamScores { get; set; } = new();

    [JsonPropertyName("averageScore")]
    public float AverageScore { get; set; }
}

public class AnalysisEntryDto
{
    [JsonPropertyName("submissionId")]
    public string SubmissionId { get; set; } = string.Empty;
    [JsonPropertyName("analysis")]
    public string Analysis { get; set; } = string.Empty;
    [JsonPropertyName("recomendation")]
    public string Recomendation { get; set; } = string.Empty;
}
