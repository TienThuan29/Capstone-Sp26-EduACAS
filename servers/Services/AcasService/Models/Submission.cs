using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class Submission
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StudentId { get; set; } = string.Empty;

    public string ProblemId { get; set; } = string.Empty;

    public string LanguageName { get; set; } = string.Empty;

    public string LanguageVersion { get; set; } = string.Empty;

    public string TextCode { get; set; } = string.Empty;

    public DateTime SubmittedDate { get; set; }

    public float FinalScore { get; set; }

    public string AiFeedback { get; set; } = string.Empty;
    
    public List<TestResult> TestResults { get; set; } = new List<TestResult>();

    public bool IsGraded { get; set; }

    public DateTime GradedDate { get; set; }

    public string RegradingRequestId { get; set; } = string.Empty;

    public string LecturerFeedback { get; set; } = string.Empty;
}

public class TestResult
{
    public string Id { get; set; } = string.Empty;

    public string TestcaseId { get; set; } = string.Empty;
    
    public string Input { get; set; } = string.Empty;
    
    public string ActualOutput { get; set; } = string.Empty;

    public string ExpectedOutput { get; set; } = string.Empty;
    
    public int ExecutionTimeMs { get; set; }

    public TestcaseStatus Status { get; set; }
    
    public DateTime CreatedDate { get; set; }
}

public enum TestcaseStatus
{
    SUCCESS,
    FAIL,
    TIMEOUT,
    COMPILE_ERROR,
    RUNTIME_ERROR,
    UNKNOWN_ERROR,
}