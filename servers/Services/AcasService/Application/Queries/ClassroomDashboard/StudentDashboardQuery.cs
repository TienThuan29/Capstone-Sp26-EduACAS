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

            var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(classroomId);
            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();
            var exams = await _examinationRepository.GetByClassIdAsync(classroomId);
            var totalExams = exams.Count;

            var allSubmissions = new List<SubModel>();
            var studentScores = new Dictionary<string, List<float>>();

            foreach (var sid in studentIds)
            {
                var subs = await _submissionRepository.GetByStudentIdAsync(sid);
                var latestSubs = subs
                    .GroupBy(s => s.ExamId)
                    .Select(g => g.OrderByDescending(s => s.Version).First())
                    .ToList();
                allSubmissions.AddRange(latestSubs);

                var scoredSubs = latestSubs
                    .Where(s => s.Status == SubStatus.GRADED)
                    .Select(s => s.FinalScore)
                    .ToList();
                if (scoredSubs.Count > 0)
                {
                    studentScores[sid] = scoredSubs;
                }
            }

            var studentAverages = studentScores
                .Where(kv => kv.Value.Count > 0)
                .ToDictionary(
                    kv => kv.Key,
                    kv => kv.Value.Average()
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

            var studentSubs = allSubmissions
                .Where(s => s.StudentId == studentId)
                .GroupBy(s => s.ExamId)
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .ToList();

            int submittedExams = studentSubs.Count(s => s.Status == SubStatus.GRADED);
            float submissionRate = totalExams > 0
                ? (float)Math.Round((double)submittedExams / totalExams * 100, 1)
                : 0f;

            var studentWarnings = await _academicWarningRepository.FindByStudentIdAsync(studentId);
            var classWarnings = studentWarnings
                .Where(w => w.ClassroomId == classroomId)
                .ToList();
            int totalWarnings = classWarnings.Count;
            int unreadWarnings = classWarnings.Count(w => !w.IsRead);

            var studentScoresList = studentSubs
                .Where(s => s.Status == SubStatus.GRADED)
                .Select(s => s.FinalScore)
                .OrderBy(s => s)
                .ToList();
            string trend = DetermineTrend(studentScoresList);

            float myAverage = studentSubs
                .Where(s => s.Status == SubStatus.GRADED)
                .Select(s => s.FinalScore)
                .DefaultIfEmpty(0f)
                .Average();

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
            var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(classroomId);

            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

            var allSubmissions = new List<SubModel>();

            foreach (var sid in studentIds)
            {
                var subs = await _submissionRepository.GetByStudentIdAsync(sid);
                var examSubs = subs.Where(s => exams.Any(e => e.Id == s.ExamId)).ToList();
                allSubmissions.AddRange(examSubs);
            }

            var result = new List<StudentExamScoreItem>();

            foreach (var exam in exams)
            {
                var examSubs = allSubmissions
                    .Where(s => s.ExamId == exam.Id)
                    .GroupBy(s => s.StudentId)
                    .Select(g => g.OrderByDescending(s => s.Version).First())
                    .ToList();

                var latestForStudent = examSubs.FirstOrDefault(s => s.StudentId == studentId);

                var classExamScores = examSubs
                    .Where(s => s.Status == SubStatus.GRADED)
                    .Select(s => s.FinalScore)
                    .ToList();

                float classAvg = classExamScores.Count > 0
                    ? (float)Math.Round(classExamScores.Average(), 2)
                    : 0f;

                int rank = 0;
                if (latestForStudent?.Status == SubStatus.GRADED)
                {
                    rank = classExamScores
                        .Count(s => s > latestForStudent.FinalScore) + 1;
                }

                result.Add(new StudentExamScoreItem
                {
                    ExamId = exam.Id,
                    ExamName = exam.ExamName,
                    Mode = exam.Mode.ToString(),
                    TotalMark = exam.TotalMark,
                    Score = latestForStudent?.Status == SubStatus.GRADED
                        ? (float)Math.Round(latestForStudent.FinalScore, 2)
                        : 0,
                    ClassAverage = classAvg,
                    Status = latestForStudent?.Status.ToString() ?? "NOT_SUBMITTED",
                    SubmittedAt = latestForStudent?.SubmittedDate,
                    Version = latestForStudent?.Version ?? 0,
                    Rank = rank
                });
            }

            return result
                .OrderByDescending(r => r.SubmittedAt)
                .ToList();
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
            var examDict = exams.ToDictionary(e => e.Id);

            var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);

            var latestSubs = submissions
                .Where(s => examDict.ContainsKey(s.ExamId))
                .GroupBy(s => s.ExamId)
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .Where(s => s.Status == SubStatus.GRADED)
                .ToList();

            return latestSubs
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

            var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
            var examIds = exams.Select(e => e.Id).ToHashSet();

            var latestSubs = submissions
                .Where(s => examIds.Contains(s.ExamId))
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
                var exam = exams.FirstOrDefault(e => e.Id == s.ExamId);
                if (exam == null || s.SubmittedDate == default) return false;
                return s.SubmittedDate > exam.EndDatetime;
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