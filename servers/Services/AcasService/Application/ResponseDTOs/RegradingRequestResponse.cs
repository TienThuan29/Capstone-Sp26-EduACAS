using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class RegradingRequestResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("examinationId")]
    public string ExaminationId { get; set; } = string.Empty;
    [JsonPropertyName("submissionId")]
    public string SubmissionId { get; set; } = string.Empty;
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;
    [JsonPropertyName("studentName")]
    public string StudentName { get; set; } = string.Empty;
    [JsonPropertyName("studentEmail")]
    public string StudentEmail { get; set; } = string.Empty;
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
    [JsonPropertyName("imageUrls")]
    public List<string> ImageUrls { get; set; } = new List<string>();
    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }
    [JsonPropertyName("status")]
    public RegradingRequestStatus Status { get; set; }
    [JsonPropertyName("statusName")]
    public string StatusName { get; set; } = string.Empty;
    [JsonPropertyName("lecturerNote")]
    public string LecturerNote { get; set; } = string.Empty;
    [JsonPropertyName("handledDate")]
    public DateTime? HandledDate { get; set; }
    [JsonPropertyName("submission")]
    public SubmissionLiteResponse? Submission { get; set; }
}

public class SubmissionLiteResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;
    [JsonPropertyName("finalScore")]
    public float FinalScore { get; set; }
    [JsonPropertyName("submittedDate")]
    public DateTime SubmittedDate { get; set; }
}
