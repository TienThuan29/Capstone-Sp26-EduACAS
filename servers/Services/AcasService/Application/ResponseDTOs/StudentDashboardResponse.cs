using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class StudentDashboardOverviewItem
{
    [JsonPropertyName("classId")]
    public string ClassId { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("averageScore")]
    public float AverageScore { get; set; }

    [JsonPropertyName("classAverage")]
    public float ClassAverage { get; set; }

    [JsonPropertyName("myRank")]
    public int MyRank { get; set; }

    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("percentile")]
    public float Percentile { get; set; }

    [JsonPropertyName("trend")]
    public string Trend { get; set; } = "stable";

    [JsonPropertyName("totalExams")]
    public int TotalExams { get; set; }

    [JsonPropertyName("submittedExams")]
    public int SubmittedExams { get; set; }

    [JsonPropertyName("submissionRate")]
    public float SubmissionRate { get; set; }

    [JsonPropertyName("totalWarnings")]
    public int TotalWarnings { get; set; }

    [JsonPropertyName("unreadWarnings")]
    public int UnreadWarnings { get; set; }
}

public class StudentExamScoreItem
{
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = string.Empty;

    [JsonPropertyName("totalMark")]
    public float TotalMark { get; set; }

    [JsonPropertyName("score")]
    public float Score { get; set; }

    [JsonPropertyName("classAverage")]
    public float ClassAverage { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("submittedAt")]
    public DateTime? SubmittedAt { get; set; }

    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("rank")]
    public int Rank { get; set; }
}

public class StudentWarningItem
{
    [JsonPropertyName("warningId")]
    public string WarningId { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("warningLevel")]
    public int WarningLevel { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; }

    [JsonPropertyName("scoreAtTime")]
    public float? ScoreAtTime { get; set; }
}

public class StudentScoreTrendItem
{
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("score")]
    public float Score { get; set; }

    [JsonPropertyName("submittedAt")]
    public DateTime SubmittedAt { get; set; }
}