using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Web.Requests;

public class SendAcademicWarningRequest
{
    [JsonPropertyName("examId")]
    [Required(ErrorMessage = "Exam ID is required")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("warningLevel")]
    [Range(1, 2, ErrorMessage = "Warning level must be 1 or 2")]
    public int WarningLevel { get; set; }
}

public class SendAcademicWarningBatchRequest
{
    [JsonPropertyName("classroomId")]
    [Required(ErrorMessage = "Classroom ID is required")]
    public string ClassroomId { get; set; } = string.Empty;

    [JsonPropertyName("examId")]
    [Required(ErrorMessage = "Exam ID is required")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("warningLevel")]
    [Range(1, 2, ErrorMessage = "Warning level must be 1 or 2")]
    public int WarningLevel { get; set; }

    [JsonPropertyName("minScoreThreshold")]
    [Range(0, 100, ErrorMessage = "Min score threshold must be between 0 and 100")]
    public float MinScoreThreshold { get; set; } = 5.0f;
}

public class SendAcademicWarningResponse
{
    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("processedStudents")]
    public int ProcessedStudents { get; set; }

    [JsonPropertyName("failedCount")]
    public int FailedCount { get; set; }

    [JsonPropertyName("results")]
    public List<StudentAcademicWarningResult> Results { get; set; } = new();
}

public class StudentAcademicWarningResult
{
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("studentEmail")]
    public string StudentEmail { get; set; } = string.Empty;

    [JsonPropertyName("studentName")]
    public string StudentName { get; set; } = string.Empty;

    [JsonPropertyName("examScore")]
    public float ExamScore { get; set; }

    [JsonPropertyName("warningCreated")]
    public bool WarningCreated { get; set; }

    [JsonPropertyName("emailSent")]
    public bool EmailSent { get; set; }

    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }
}

public class BatchAcceptedResponse
{
    [JsonPropertyName("jobId")]
    public string JobId { get; set; } = string.Empty;
}
