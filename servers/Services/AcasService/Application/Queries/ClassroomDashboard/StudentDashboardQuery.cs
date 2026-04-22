using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.AcademicWarning;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Submission;
using SubModel = AcasService.Models.Submission;
using SubStatus = AcasService.Models.SubmissionStatus;

namespace AcasService.Application.Queries.ClassroomDashboard;

public interface IStudentDashboardQuery
{
    Task<StudentDashboardOverviewItem?> GetOverviewAsync(string classroomId, string studentId);
    Task<List<StudentExamScoreItem>> GetExamScoresAsync(string classroomId, string studentId);
    Task<List<StudentWarningItem>> GetWarningsAsync(string studentId, int limit = 10);
    Task<List<StudentScoreTrendItem>> GetScoreTrendAsync(string classroomId, string studentId);
    Task<StudentSubmissionStatsItem?> GetSubmissionStatsAsync(string classroomId, string studentId);
}

public class StudentSubmissionStatsItem
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int TotalExams { get; set; }
    public int SubmittedExams { get; set; }
    public float SubmissionRate { get; set; }
    public DateTime? LatestSubmissionTime { get; set; }
    public bool IsLate { get; set; }
}

public class StudentDashboardQuery : IStudentDashboardQuery
{
    private readonly ILogger<StudentDashboardQuery> _logger;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IAcademicWarningRepository _academicWarningRepository;

    public StudentDashboardQuery(
        ILogger<StudentDashboardQuery> logger,
        ISubmissionRepository submissionRepository,
        IClassroomEnrollmentRepository classroomEnrollmentRepository,
        IClassroomRepository classroomRepository,
        IExaminationRepository examinationRepository,
        IAcademicWarningRepository academicWarningRepository)
    {
        _logger = logger;
        _submissionRepository = submissionRepository;
        _classroomEnrollmentRepository = classroomEnrollmentRepository;
        _classroomRepository = classroomRepository;
        _examinationRepository = examinationRepository;
        _academicWarningRepository = academicWarningRepository;
    }

    public async Task<StudentDashboardOverviewItem?> GetOverviewAsync(string classroomId, string studentId)
    {
        try
        {
            var classroom = await _classroomRepository.FindByIdAsync(classroomId);
            var className = classroom?.ClassName ?? "Unknown";

            var exams = await _examinationRepository.GetByClassIdAsync(classroomId);
            var totalExams = exams.Count;

            if (totalExams == 0)
            {
                return new StudentDashboardOverviewItem
                {
                    ClassId = classroomId,
                    ClassName = className,
                    AverageScore = 0,
                    ClassAverage = 0,
                    MyRank = 0,
                    TotalStudents = 0,
                    Percentile = 0,
                    Trend = "stable",
                    TotalExams = 0,
                    SubmittedExams = 0,
                    SubmissionRate = 0,
                    TotalWarnings = 0,
                    UnreadWarnings = 0
                };
            }

            var examIds = exams.Select(e => e.Id).ToHashSet();
            var allSubmissions = await _submissionRepository.GetByExamIdsAsync(examIds.ToList());

            var latestByStudentAndExam = allSubmissions
                .GroupBy(s => (s.StudentId, s.ExamId, s.ProblemId))
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .ToList();

            var examDict = exams.ToDictionary(e => e.Id);

            var studentExamTotalScores = latestByStudentAndExam
                .Where(s => s.Status == SubStatus.GRADED)
                .GroupBy(s => new { s.StudentId, s.ExamId })
                .Select(g => new { g.Key.StudentId, g.Key.ExamId, ExamTotal = g.Sum(s => s.FinalScore) })
                .ToList();

            var studentAverages = studentExamTotalScores
                .GroupBy(s => s.StudentId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Average(s => s.ExamTotal)
                );

            var classAverage = studentAverages.Count > 0
                ? (float)Math.Round(studentAverages.Values.Average(), 2)
                : 0f;

            var rankedStudents = studentAverages
                .OrderByDescending(kv => kv.Value)
                .Select((kv, idx) => new { StudentId = kv.Key, Rank = idx + 1 })
                .ToList();

            int myRank = rankedStudents.FirstOrDefault(r => r.StudentId == studentId)?.Rank ?? 0;
            float percentile = studentAverages.Count > 0
                ? (float)Math.Round((1 - (myRank - 1) / (float)studentAverages.Count) * 100, 1)
                : 0f;

            var myExamTotalScores = studentExamTotalScores
                .Where(s => s.StudentId == studentId)
                .ToList();

            int submittedExams = myExamTotalScores.Count;
            float submissionRate = totalExams > 0
                ? (float)Math.Round((double)submittedExams / totalExams * 100, 1)
                : 0f;

            var studentWarnings = await _academicWarningRepository.FindByStudentIdAsync(studentId);
            var classWarnings = studentWarnings
                .Where(w => w.ClassroomId == classroomId)
                .ToList();
            int totalWarnings = classWarnings.Count;
            int unreadWarnings = classWarnings.Count(w => !w.IsRead);

            var studentScoresList = myExamTotalScores
                .Select(s => s.ExamTotal)
                .OrderBy(s => s)
                .ToList();
            string trend = DetermineTrend(studentScoresList);

            float myAverage = myExamTotalScores.Count > 0
                ? (float)Math.Round(myExamTotalScores.Average(s => s.ExamTotal), 2)
                : 0f;

            return new StudentDashboardOverviewItem
            {
                ClassId = classroomId,
                ClassName = className,
                AverageScore = (float)Math.Round(myAverage, 2),
                ClassAverage = classAverage,
                MyRank = myRank,
                TotalStudents = studentAverages.Count,
                Percentile = percentile,
                Trend = trend,
                TotalExams = totalExams,
                SubmittedExams = submittedExams,
                SubmissionRate = submissionRate,
                TotalWarnings = totalWarnings,
                UnreadWarnings = unreadWarnings
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student dashboard overview for student {StudentId} in classroom {ClassroomId}", studentId, classroomId);
            throw;
        }
    }

    public async Task<List<StudentExamScoreItem>> GetExamScoresAsync(string classroomId, string studentId)
    {
        try
        {
            var exams = await _examinationRepository.GetByClassIdAsync(classroomId);

            if (exams.Count == 0)
            {
                return new List<StudentExamScoreItem>();
            }

            var examIds = exams.Select(e => e.Id).ToHashSet();
            var allSubmissions = await _submissionRepository.GetByExamIdsAsync(examIds.ToList());

            var latestByStudentAndExam = allSubmissions
                .GroupBy(s => (s.StudentId, s.ExamId, s.ProblemId))
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .ToList();

            var result = new List<StudentExamScoreItem>();

            foreach (var exam in exams)
            {
                var examSubs = latestByStudentAndExam
                    .Where(s => s.ExamId == exam.Id)
                    .ToList();

                var studentExamSubs = examSubs
                    .Where(s => s.StudentId == studentId)
                    .ToList();

                var latestForStudent = studentExamSubs.FirstOrDefault();

                var classExamScores = examSubs
                    .Where(s => s.Status == SubStatus.GRADED)
                    .GroupBy(s => s.StudentId)
                    .Select(g => g.Sum(s => s.FinalScore))
                    .ToList();

                float classAvg = classExamScores.Count > 0
                    ? (float)Math.Round(classExamScores.Average(), 2)
                    : 0f;

                float studentScore = studentExamSubs
                    .Where(s => s.Status == SubStatus.GRADED)
                    .Sum(s => s.FinalScore);
                studentScore = (float)Math.Round(studentScore, 2);

                int rank = 0;
                if (latestForStudent?.Status == SubStatus.GRADED)
                {
                    rank = classExamScores.Count(s => s > studentScore) + 1;
                }

                result.Add(new StudentExamScoreItem
                {
                    ExamId = exam.Id,
                    ExamName = exam.ExamName,
                    Mode = exam.Mode.ToString(),
                    TotalMark = exam.TotalMark,
                    Score = studentScore,
                    ClassAverage = classAvg,
                    Status = latestForStudent?.Status.ToString() ?? "NOT_SUBMITTED",
                    SubmittedAt = latestForStudent?.SubmittedDate,
                    Version = latestForStudent?.Version ?? 0,
                    Rank = rank
                });
            }

            return result.OrderByDescending(r => r.SubmittedAt).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting exam scores for student {StudentId} in classroom {ClassroomId}", studentId, classroomId);
            throw;
        }
    }

    public async Task<List<StudentWarningItem>> GetWarningsAsync(string studentId, int limit = 10)
    {
        try
        {
            var warnings = await _academicWarningRepository.FindByStudentIdAsync(studentId);

            return warnings
                .OrderByDescending(w => w.SentDate)
                .Take(limit)
                .Select(w => new StudentWarningItem
                {
                    WarningId = w.Id,
                    ClassName = w.ClassroomId,
                    WarningLevel = w.WarningLevel,
                    Reason = w.TriggerType.ToString(),
                    CreatedAt = w.SentDate,
                    IsRead = w.IsRead,
                    ScoreAtTime = w.InvolvedExams.AverageScore
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting warnings for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<List<StudentScoreTrendItem>> GetScoreTrendAsync(string classroomId, string studentId)
    {
        try
        {
            var exams = await _examinationRepository.GetByClassIdAsync(classroomId);

            if (exams.Count == 0)
            {
                return new List<StudentScoreTrendItem>();
            }

            var examIds = exams.Select(e => e.Id).ToHashSet();
            var submissions = await _submissionRepository.GetByExamIdsAsync(examIds.ToList());

            var studentSubs = submissions
                .Where(s => s.StudentId == studentId && examIds.Contains(s.ExamId))
                .GroupBy(s => s.ExamId)
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .Where(s => s.Status == SubStatus.GRADED)
                .ToList();

            var examDict = exams.ToDictionary(e => e.Id);

            return studentSubs
                .OrderBy(s => s.SubmittedDate)
                .Select(s => new StudentScoreTrendItem
                {
                    ExamId = s.ExamId,
                    ExamName = examDict.TryGetValue(s.ExamId, out var exam) ? exam.ExamName : "Unknown",
                    Score = (float)Math.Round(s.FinalScore, 2),
                    SubmittedAt = s.SubmittedDate
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting score trend for student {StudentId} in classroom {ClassroomId}", studentId, classroomId);
            throw;
        }
    }

    public async Task<StudentSubmissionStatsItem?> GetSubmissionStatsAsync(string classroomId, string studentId)
    {
        try
        {
            var classroom = await _classroomRepository.FindByIdAsync(classroomId);
            var className = classroom?.ClassName ?? "Unknown";

            var exams = await _examinationRepository.GetByClassIdAsync(classroomId);
            int totalExams = exams.Count;

            if (totalExams == 0)
            {
                return new StudentSubmissionStatsItem
                {
                    ClassId = classroomId,
                    ClassName = className,
                    TotalExams = 0,
                    SubmittedExams = 0,
                    SubmissionRate = 0,
                    LatestSubmissionTime = null,
                    IsLate = false
                };
            }

            var examIds = exams.Select(e => e.Id).ToHashSet();
            var examDict = exams.ToDictionary(e => e.Id);

            var submissions = await _submissionRepository.GetByExamIdsAsync(examIds.ToList());

            var latestSubs = submissions
                .Where(s => s.StudentId == studentId && examIds.Contains(s.ExamId))
                .GroupBy(s => s.ExamId)
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .ToList();

            int submittedExams = latestSubs.Count(s => s.Status == SubStatus.GRADED);
            float submissionRate = totalExams > 0
                ? (float)Math.Round((double)submittedExams / totalExams * 100, 1)
                : 0f;

            var latestSubmission = latestSubs
                .Where(s => s.SubmittedDate != default)
                .OrderByDescending(s => s.SubmittedDate)
                .FirstOrDefault();

            bool isLate = latestSubs.Any(s =>
            {
                if (s.SubmittedDate == default) return false;
                return examDict.TryGetValue(s.ExamId, out var exam)
                    && s.SubmittedDate > exam.EndDatetime;
            });

            return new StudentSubmissionStatsItem
            {
                ClassId = classroomId,
                ClassName = className,
                TotalExams = totalExams,
                SubmittedExams = submittedExams,
                SubmissionRate = submissionRate,
                LatestSubmissionTime = latestSubmission?.SubmittedDate,
                IsLate = isLate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting submission stats for student {StudentId} in classroom {ClassroomId}", studentId, classroomId);
            throw;
        }
    }

    private static string DetermineTrend(List<float> scores)
    {
        if (scores.Count < 2) return "stable";

        var orderedScores = scores.OrderBy(s => s).ToList();
        var midpoint = orderedScores.Count / 2;
        var firstHalfAvg = orderedScores.Take(midpoint).Average();
        var secondHalfAvg = orderedScores.Skip(midpoint).Average();

        var diff = secondHalfAvg - firstHalfAvg;
        if (diff > 0.5f) return "improving";
        if (diff < -0.5f) return "declining";
        return "stable";
    }
}