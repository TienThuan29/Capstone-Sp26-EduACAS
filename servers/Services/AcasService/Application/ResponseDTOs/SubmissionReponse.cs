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

/// <summary>
/// Minimal student info for display in submission detail (from AuthService user profile).
/// </summary>
public class StudentLiteResponse
{
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("fullname")]
    public string Fullname { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("roleNumber")]
    public string RoleNumber { get; set; } = string.Empty;
}

public class SubmissionResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("languageId")]
    public string LanguageId { get; set; } = string.Empty;

    [JsonPropertyName("compilerId")]
    public string CompilerId { get; set; } = string.Empty;

    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("submittedDate")]
    public DateTime SubmittedDate { get; set; }

    [JsonPropertyName("finalScore")]
    public float FinalScore { get; set; }

    [JsonPropertyName("gradedDate")]
    public DateTime? GradedDate { get; set; }

    [JsonPropertyName("testResults")]
    public List<TestResultResponse> TestResults { get; set; } = new();

    [JsonPropertyName("regradingRequestId")]
    public string RegradingRequestId { get; set; } = string.Empty;

    [JsonPropertyName("lecturerFeedback")]
    public string LecturerFeedback { get; set; } = string.Empty;

    [JsonPropertyName("aiFeedback")]
    public string AiFeedback { get; set; } = string.Empty;

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }

    /// <summary>
    /// Optional problem info (e.g. title) for UI display. Populated when querying by exam/problem.
    /// </summary>
    [JsonPropertyName("problem")]
    public ProblemLiteResponse? Problem { get; set; }

    /// <summary>
    /// Optional student info for UI display. Populated when querying submission by id (e.g. detail view).
    /// </summary>
    [JsonPropertyName("student")]
    public StudentLiteResponse? Student { get; set; }
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

/// <summary>
/// Response for run auto-grading on all submissions of a problem. For frontend to show summary and per-submission results.
/// </summary>
public class AutoGradeProblemResponse
{
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("totalSubmissions")]
    public int TotalSubmissions { get; set; }

    [JsonPropertyName("gradedCount")]
    public int GradedCount { get; set; }

    [JsonPropertyName("failedCount")]
    public int FailedCount { get; set; }

    [JsonPropertyName("results")]
    public List<AutoGradeSubmissionResult> Results { get; set; } = new();
}

/// <summary>
/// Submissions for one problem when fetching latest by exam 
/// </summary>
public class ProblemSubmissionsResponse
{
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("submissions")]
    public List<SubmissionResponse> Submissions { get; set; } = new();
}

/// <summary>
/// Per-submission result for auto-grading (one row in the grading table / refresh list).
/// </summary>
public class AutoGradeSubmissionResult
{
    [JsonPropertyName("submissionId")]
    public string SubmissionId { get; set; } = string.Empty;

    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("finalScore")]
    public float FinalScore { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("gradedDate")]
    public DateTime GradedDate { get; set; }

    [JsonPropertyName("passedTestCases")]
    public int PassedTestCases { get; set; }

    [JsonPropertyName("totalTestCases")]
    public int TotalTestCases { get; set; }

    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }
}
