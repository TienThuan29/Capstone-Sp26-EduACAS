using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("SubmissionTableName")]
public class Submission
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StudentId { get; set; } = string.Empty;

    public string ExamId { get; set; } = string.Empty;

    public string ProblemId { get; set; } = string.Empty;

    public string LanguageId { get; set; } = string.Empty;

    public string CompilerId { get; set; } = string.Empty;

    public string Source { get; set; } = string.Empty;

    public int Version { get; set; }

    public DateTime SubmittedDate { get; set; }

    public float FinalScore { get; set; }

    public SubmissionStatus Status { get; set; }

    public DateTime? GradedDate { get; set; }

    public List<TestResult> TestResults { get; set; } = new List<TestResult>();

    public string RegradingRequestId { get; set; } = string.Empty;

    public string LecturerFeedback { get; set; } = string.Empty;

    public string AiFeedback { get; set; } = string.Empty;

    public DateTime UpdatedDate { get; set; }
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

public enum SubmissionStatus
{
    PENDING,
    GRADED,
    REGRADING,
    REGRADED
}