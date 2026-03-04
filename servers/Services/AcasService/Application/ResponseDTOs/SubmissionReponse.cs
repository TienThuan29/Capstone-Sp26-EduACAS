using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

/// <summary>
/// Minimal problem info for display in submission responses (e.g. in grading UI).
/// </summary>
public class ProblemLiteResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
}

public class SubmissionResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("submittedDate")]
    public DateTime SubmittedDate { get; set; }

    [JsonPropertyName("finalScore")]
    public float FinalScore { get; set; }

    /// <summary>
    /// Optional problem info (e.g. title) for UI display. Populated when querying by exam/problem.
    /// </summary>
    [JsonPropertyName("problem")]
    public ProblemLiteResponse? Problem { get; set; }
}

public class TestResultResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("testcaseId")]
    public string TestcaseId { get; set; } = string.Empty;

    [JsonPropertyName("input")]
    public string Input { get; set; } = string.Empty;

    [JsonPropertyName("actualOutput")]
    public string ActualOutput { get; set; } = string.Empty;

    [JsonPropertyName("expectedOutput")]
    public string ExpectedOutput { get; set; } = string.Empty;

    [JsonPropertyName("executionTimeMs")]
    public int ExecutionTimeMs { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }
}
