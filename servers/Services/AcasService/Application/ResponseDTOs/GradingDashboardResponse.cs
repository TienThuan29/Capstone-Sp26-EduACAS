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

public class QuizScoreStatisticsItem
{
    [JsonPropertyName("quizId")]
    public string QuizId { get; set; } = string.Empty;

    [JsonPropertyName("classroomQuizId")]
    public string ClassroomQuizId { get; set; } = string.Empty;

    [JsonPropertyName("quizTitle")]
    public string QuizTitle { get; set; } = string.Empty;

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

    [JsonPropertyName("totalAttempts")]
    public int TotalAttempts { get; set; }

    [JsonPropertyName("submissionRate")]
    public float SubmissionRate { get; set; }

    [JsonPropertyName("passRate")]
    public float PassRate { get; set; }

    [JsonPropertyName("startTime")]
    public DateTime StartTime { get; set; }

    [JsonPropertyName("endTime")]
    public DateTime EndTime { get; set; }

    [JsonPropertyName("scoreDistribution")]
    public List<ScoreDistributionItem> ScoreDistribution { get; set; } = new();
}

// Admin Examination & Submission System-Wide Statistics

public class AdminExaminationStatisticsResponse
{
    [JsonPropertyName("totalExaminations")]
    public int TotalExaminations { get; set; }

    [JsonPropertyName("activeExaminations")]
    public int ActiveExaminations { get; set; }

    [JsonPropertyName("completedExaminations")]
    public int CompletedExaminations { get; set; }

    [JsonPropertyName("pendingExaminations")]
    public int PendingExaminations { get; set; }

    [JsonPropertyName("practicalExaminations")]
    public int PracticalExaminations { get; set; }

    [JsonPropertyName("examinationModeExaminations")]
    public int ExaminationModeExaminations { get; set; }

    [JsonPropertyName("totalSubmissions")]
    public int TotalSubmissions { get; set; }

    [JsonPropertyName("totalStudentsWithSubmissions")]
    public int TotalStudentsWithSubmissions { get; set; }

    [JsonPropertyName("overallPassRate")]
    public float OverallPassRate { get; set; }

    [JsonPropertyName("overallAverageScore")]
    public float OverallAverageScore { get; set; }

    [JsonPropertyName("submissionRate")]
    public float SubmissionRate { get; set; }

    [JsonPropertyName("examinationList")]
    public List<ExaminationListItem> ExaminationList { get; set; } = new();
}

public class ExaminationListItem
{
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;

    [JsonPropertyName("classroomName")]
    public string ClassroomName { get; set; } = string.Empty;

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("totalMark")]
    public float TotalMark { get; set; }

    [JsonPropertyName("averageScore")]
    public float AverageScore { get; set; }

    [JsonPropertyName("totalSubmissions")]
    public int TotalSubmissions { get; set; }

    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("passRate")]
    public float PassRate { get; set; }

    [JsonPropertyName("startDatetime")]
    public DateTime StartDatetime { get; set; }

    [JsonPropertyName("endDatetime")]
    public DateTime EndDatetime { get; set; }
}

public class SubmissionByLanguageItem
{
    [JsonPropertyName("languageId")]
    public string LanguageId { get; set; } = string.Empty;

    [JsonPropertyName("languageName")]
    public string LanguageName { get; set; } = string.Empty;

    [JsonPropertyName("totalSubmissions")]
    public int TotalSubmissions { get; set; }

    [JsonPropertyName("uniqueStudents")]
    public int UniqueStudents { get; set; }

    [JsonPropertyName("percentage")]
    public float Percentage { get; set; }

    [JsonPropertyName("averageScore")]
    public float AverageScore { get; set; }

    [JsonPropertyName("passRate")]
    public float PassRate { get; set; }
}

public class SubmissionByLanguageResponse
{
    [JsonPropertyName("totalSubmissions")]
    public int TotalSubmissions { get; set; }

    [JsonPropertyName("totalLanguages")]
    public int TotalLanguages { get; set; }

    [JsonPropertyName("topLanguage")]
    public string TopLanguage { get; set; } = string.Empty;

    [JsonPropertyName("languageBreakdown")]
    public List<SubmissionByLanguageItem> LanguageBreakdown { get; set; } = new();
}

// Admin User Management Statistics

public class StudentLecturerRatioResponse
{
    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("totalLecturers")]
    public int TotalLecturers { get; set; }

    [JsonPropertyName("ratio")]
    public string Ratio { get; set; } = string.Empty;

    [JsonPropertyName("ratioDecimal")]
    public float RatioDecimal { get; set; }

    [JsonPropertyName("totalClassrooms")]
    public int TotalClassrooms { get; set; }

    [JsonPropertyName("totalEnrollments")]
    public int TotalEnrollments { get; set; }
}

public class SubjectStudentDistributionItem
{
    [JsonPropertyName("subjectId")]
    public string SubjectId { get; set; } = string.Empty;

    [JsonPropertyName("subjectCode")]
    public string SubjectCode { get; set; } = string.Empty;

    [JsonPropertyName("subjectName")]
    public string SubjectName { get; set; } = string.Empty;

    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("totalClasses")]
    public int TotalClasses { get; set; }

    [JsonPropertyName("totalLecturers")]
    public int TotalLecturers { get; set; }

    [JsonPropertyName("percentage")]
    public float Percentage { get; set; }
}

public class UsersBySubjectResponse
{
    [JsonPropertyName("totalStudents")]
    public int TotalStudents { get; set; }

    [JsonPropertyName("totalSubjects")]
    public int TotalSubjects { get; set; }

    [JsonPropertyName("distribution")]
    public List<SubjectStudentDistributionItem> Distribution { get; set; } = new();
}
