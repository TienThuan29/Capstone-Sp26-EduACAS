using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class DashboardOverviewResponse
{
    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("totalStudentsChange")]
    public int TotalStudentsChange { get; set; }

    [JsonPropertyName("classAverage")]
    public float ClassAverage { get; set; }

    [JsonPropertyName("classAverageChange")]
    public float ClassAverageChange { get; set; }

    [JsonPropertyName("atRiskCount")]
    public int AtRiskCount { get; set; }

    [JsonPropertyName("atRiskPercentage")]
    public float AtRiskPercentage { get; set; }

    [JsonPropertyName("atRiskChange")]
    public int AtRiskChange { get; set; }

    [JsonPropertyName("totalWarnings")]
    public int TotalWarnings { get; set; }

    [JsonPropertyName("newWarningsToday")]
    public int NewWarningsToday { get; set; }

    [JsonPropertyName("lastUpdated")]
    public DateTime LastUpdated { get; set; }
}

public class ScoreDistributionItem
{
    [JsonPropertyName("range")]
    public string Range { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("percentage")]
    public float Percentage { get; set; }
}

public class AtRiskStudentItem
{
    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("studentName")]
    public string StudentName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("roleNumber")]
    public string RoleNumber { get; set; } = string.Empty;

    [JsonPropertyName("averageScore")]
    public float AverageScore { get; set; }

    [JsonPropertyName("riskLevel")]
    public string RiskLevel { get; set; } = string.Empty;

    [JsonPropertyName("warningLevel")]
    public int WarningLevel { get; set; }

    [JsonPropertyName("trend")]
    public string Trend { get; set; } = "stable";

    [JsonPropertyName("warningCount")]
    public int WarningCount { get; set; }

    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;

    [JsonPropertyName("classroomName")]
    public string ClassroomName { get; set; } = string.Empty;
}

public class ClassStatsItem
{
    [JsonPropertyName("classId")]
    public string ClassId { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("classAverage")]
    public float ClassAverage { get; set; }

    [JsonPropertyName("atRiskCount")]
    public int AtRiskCount { get; set; }
}

public class RecentWarningItem
{
    [JsonPropertyName("warningId")]
    public string WarningId { get; set; } = string.Empty;

    [JsonPropertyName("studentName")]
    public string StudentName { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("warningLevel")]
    public int WarningLevel { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; }
}

public class ExamScoreStatisticsItem
{
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = string.Empty;

    [JsonPropertyName("totalMark")]
    public float TotalMark { get; set; }

    [JsonPropertyName("averageScore")]
    public float AverageScore { get; set; }

    [JsonPropertyName("highestScore")]
    public float HighestScore { get; set; }

    [JsonPropertyName("lowestScore")]
    public float LowestScore { get; set; }

    [JsonPropertyName("medianScore")]
    public float MedianScore { get; set; }

    [JsonPropertyName("totalSubmissions")]
    public int TotalSubmissions { get; set; }

    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("submissionRate")]
    public float SubmissionRate { get; set; }

    [JsonPropertyName("passRate")]
    public float PassRate { get; set; }

    [JsonPropertyName("startDatetime")]
    public DateTime StartDatetime { get; set; }

    [JsonPropertyName("endDatetime")]
    public DateTime EndDatetime { get; set; }

    [JsonPropertyName("scoreDistribution")]
    public List<ExamScoreDistributionItem> ScoreDistribution { get; set; } = new();
}

public class ExamScoreDistributionItem
{
    [JsonPropertyName("range")]
    public string Range { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("percentage")]
    public float Percentage { get; set; }
}
