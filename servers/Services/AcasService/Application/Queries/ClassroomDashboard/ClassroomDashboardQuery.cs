using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.AcademicWarning;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Problem;
using AcasService.Repositories.Submission;

namespace AcasService.Application.Queries.ClassroomDashboard;

public interface IClassroomDashboardQuery
{
    Task<List<ScoreDistributionItem>> GetScoreDistributionAsync(string classroomId, string? mode = null);
    Task<List<AtRiskStudentItem>> GetAtRiskStudentsAsync(string classroomId, int limit);
    Task<List<RecentWarningItem>> GetRecentWarningsAsync(string classroomId, int limit);
    Task<List<ClassStatsItem>> GetClassStatsAsync(string? classroomId);
    Task<List<ExamScoreStatisticsItem>> GetExamScoreStatisticsAsync(string classroomId, string? examId = null);
}

public class ClassroomDashboardQuery : IClassroomDashboardQuery
{
    private readonly ILogger<ClassroomDashboardQuery> _logger;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IAcademicWarningRepository _academicWarningRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IProblemRepository _problemRepository;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly SubmissionMapper _submissionMapper;

    public ClassroomDashboardQuery(
        ILogger<ClassroomDashboardQuery> logger,
        ISubmissionRepository submissionRepository,
        IClassroomEnrollmentRepository classroomEnrollmentRepository,
        IClassroomRepository classroomRepository,
        IAcademicWarningRepository academicWarningRepository,
        IExaminationRepository examinationRepository,
        IProblemRepository problemRepository,
        UserRequestProducer userRequestProducer,
        SubmissionMapper submissionMapper)
    {
        _logger = logger;
        _submissionRepository = submissionRepository;
        _classroomEnrollmentRepository = classroomEnrollmentRepository;
        _classroomRepository = classroomRepository;
        _academicWarningRepository = academicWarningRepository;
        _examinationRepository = examinationRepository;
        _problemRepository = problemRepository;
        _userRequestProducer = userRequestProducer;
        _submissionMapper = submissionMapper;
    }

    public async Task<List<ScoreDistributionItem>> GetScoreDistributionAsync(string classroomId, string? mode = null)
    {
        try
        {
            var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(classroomId);
            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

            if (studentIds.Count == 0)
            {
                return GetDefaultScoreDistribution();
            }

            // Get all exams for this classroom
            var exams = await _examinationRepository.GetByClassIdAsync(classroomId);

            // Filter exams by mode if specified
            if (!string.IsNullOrEmpty(mode))
            {
                if (Enum.TryParse<Mode>(mode, true, out var modeEnum))
                {
                    exams = exams.Where(e => e.Mode == modeEnum).ToList();
                }
            }

            var examIds = exams.Select(e => e.Id).ToHashSet();

            var allSubmissions = new List<Models.Submission>();
            foreach (var studentId in studentIds)
            {
                var studentSubs = await _submissionRepository.GetByStudentIdAsync(studentId);
                // Filter submissions by exam mode
                var filteredSubs = studentSubs.Where(s => examIds.Contains(s.ExamId)).ToList();
                allSubmissions.AddRange(filteredSubs);
            }

            if (allSubmissions.Count == 0)
            {
                return GetDefaultScoreDistribution();
            }

            var scoreGroups = allSubmissions
                .GroupBy(s => GetScoreRange(s.FinalScore))
                .Select(g => new ScoreDistributionItem
                {
                    Range = g.Key,
                    Count = g.Count(),
                    Percentage = (float)Math.Round((double)g.Count() / allSubmissions.Count * 100, 2)
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            return scoreGroups;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting score distribution for classroom {ClassroomId} with mode {Mode}", classroomId, mode);
            throw;
        }
    }

    public async Task<List<AtRiskStudentItem>> GetAtRiskStudentsAsync(string classroomId, int limit)
    {
        try
        {
            var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(classroomId);
            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

            if (studentIds.Count == 0)
            {
                return new List<AtRiskStudentItem>();
            }

            var studentScores = new Dictionary<string, List<float>>();
            var studentWarnings = new Dictionary<string, List<AcademicWarning>>();

            foreach (var studentId in studentIds)
            {
                var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
                studentScores[studentId] = submissions.Select(s => s.FinalScore).ToList();

                var warnings = await _academicWarningRepository.FindByStudentIdAsync(studentId);
                studentWarnings[studentId] = warnings;
            }

            var riskStudents = studentScores
                .Where(kv => kv.Value.Count > 0 && kv.Value.Average() < 5f)
                .Select(kv => new
                {
                    StudentId = kv.Key,
                    AverageScore = (float)Math.Round(kv.Value.Average(), 2),
                    WarningCount = studentWarnings.GetValueOrDefault(kv.Key)?.Count ?? 0
                })
                .OrderBy(x => x.AverageScore)
                .Take(limit)
                .ToList();

            var userProfiles = await _userRequestProducer.GetUsersByIdsAsync(riskStudents.Select(s => s.StudentId).ToList());
            var userById = userProfiles.ToDictionary(u => u.Id, u => u);

            var classroom = await _classroomRepository.FindByIdAsync(classroomId);
            var classroomName = classroom?.ClassName ?? string.Empty;

            var result = new List<AtRiskStudentItem>();
            foreach (var student in riskStudents)
            {
                var profile = userById.GetValueOrDefault(student.StudentId);

                result.Add(new AtRiskStudentItem
                {
                    StudentId = student.StudentId,
                    StudentName = profile?.Fullname ?? string.Empty,
                    Email = profile?.Email ?? string.Empty,
                    RoleNumber = profile?.RoleNumber ?? string.Empty,
                    AverageScore = student.AverageScore,
                    RiskLevel = GetRiskLevel(student.AverageScore),
                    WarningLevel = student.WarningCount > 0 ? (student.WarningCount >= 2 ? 2 : 1) : 0,
                    Trend = DetermineTrend(studentScores[student.StudentId]),
                    WarningCount = student.WarningCount,
                    ClassroomId = classroomId,
                    ClassroomName = classroomName
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting at-risk students for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<List<RecentWarningItem>> GetRecentWarningsAsync(string classroomId, int limit)
    {
        try
        {
            var warnings = await _academicWarningRepository.FindByClassroomIdAsync(classroomId);

            var recentWarnings = warnings
                .OrderByDescending(w => w.SentDate)
                .Take(limit)
                .ToList();

            var studentIds = recentWarnings.Select(w => w.StudentId).Distinct().ToList();
            var userProfiles = await _userRequestProducer.GetUsersByIdsAsync(studentIds.ToList());
            var userById = userProfiles.ToDictionary(u => u.Id, u => u);

            var classroom = await _classroomRepository.FindByIdAsync(classroomId);
            var classroomName = classroom?.ClassName ?? string.Empty;

            return recentWarnings.Select(w =>
            {
                var profile = userById.GetValueOrDefault(w.StudentId);
                return new RecentWarningItem
                {
                    WarningId = w.Id,
                    StudentName = profile?.Fullname ?? string.Empty,
                    ClassName = classroomName,
                    WarningLevel = w.WarningLevel,
                    Message = $"Academic warning triggered: {w.TriggerType}",
                    CreatedAt = w.SentDate,
                    IsRead = w.IsRead
                };
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent warnings for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<List<ClassStatsItem>> GetClassStatsAsync(string? classroomId)
    {
        try
        {
            var enrollments = await _classroomEnrollmentRepository.FindByAllAsync();

            if (!string.IsNullOrEmpty(classroomId) && classroomId != "all")
            {
                enrollments = enrollments.Where(e => e.ClassId == classroomId).ToList();
            }

            var classroomIds = enrollments.Select(e => e.ClassId).Distinct().ToList();
            var classrooms = await _classroomRepository.FindByIdsAsync(classroomIds);
            var classroomMap = classrooms.ToDictionary(c => c.Id, c => c);

            var result = new List<ClassStatsItem>();
            foreach (var classId in classroomIds)
            {
                var classEnrollments = enrollments.Where(e => e.ClassId == classId).ToList();
                var studentIds = classEnrollments.Select(e => e.StudentId).Distinct().ToList();

                var allSubmissions = new List<Models.Submission>();
                foreach (var studentId in studentIds)
                {
                    var subs = await _submissionRepository.GetByStudentIdAsync(studentId);
                    allSubmissions.AddRange(subs);
                }

                var warnings = await _academicWarningRepository.FindByClassroomIdAsync(classId);

                var atRiskCount = studentIds.Count(studentId =>
                {
                    var studentSubs = allSubmissions.Where(s => s.StudentId == studentId).ToList();
                    return studentSubs.Count > 0 && studentSubs.Average(s => s.FinalScore) < 5f;
                });

                var avgScore = allSubmissions.Count > 0
                    ? allSubmissions.Average(s => s.FinalScore)
                    : 0f;

                classroomMap.TryGetValue(classId, out var classroom);
                result.Add(new ClassStatsItem
                {
                    ClassId = classId,
                    ClassName = classroom?.ClassName ?? string.Empty,
                    TotalStudents = studentIds.Count,
                    ClassAverage = (float)Math.Round(avgScore, 2),
                    AtRiskCount = atRiskCount
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting class stats");
            throw;
        }
    }

    public async Task<List<ExamScoreStatisticsItem>> GetExamScoreStatisticsAsync(string classroomId, string? examId = null)
    {
        try
        {
            var exams = await _examinationRepository.GetByClassIdAsync(classroomId);

            if (!string.IsNullOrEmpty(examId))
            {
                exams = exams.Where(e => e.Id == examId).ToList();
            }

            if (exams.Count == 0)
            {
                return new List<ExamScoreStatisticsItem>();
            }

            var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(classroomId);
            var totalStudents = enrollments.Select(e => e.StudentId).Distinct().Count();

            var result = new List<ExamScoreStatisticsItem>();

            foreach (var exam in exams)
            {
                var submissions = await _submissionRepository.GetByExamIdAsync(exam.Id);

                var latestSubmissionsByStudent = submissions
                    .GroupBy(s => s.StudentId)
                    .Select(g => g.OrderByDescending(s => s.Version).First())
                    .ToList();

                if (latestSubmissionsByStudent.Count == 0)
                {
                    result.Add(new ExamScoreStatisticsItem
                    {
                        ExamId = exam.Id,
                        ExamName = exam.ExamName,
                        TotalMark = exam.TotalMark,
                        AverageScore = 0,
                        HighestScore = 0,
                        LowestScore = 0,
                        MedianScore = 0,
                        TotalSubmissions = 0,
                        TotalStudents = totalStudents,
                        SubmissionRate = 0,
                        PassRate = 0,
                        StartDatetime = exam.StartDatetime,
                        EndDatetime = exam.EndDatetime,
                        ScoreDistribution = GetDefaultExamScoreDistribution()
                    });
                    continue;
                }

                var scores = latestSubmissionsByStudent
                    .Where(s => s.Status == SubmissionStatus.GRADED)
                    .Select(s => s.FinalScore)
                    .OrderBy(s => s)
                    .ToList();

                var averageScore = scores.Count > 0 ? scores.Average() : 0f;
                var highestScore = scores.Count > 0 ? scores.Max() : 0f;
                var lowestScore = scores.Count > 0 ? scores.Min() : 0f;
                var medianScore = CalculateMedian(scores);

                var totalSubmissions = latestSubmissionsByStudent.Count;
                var submissionRate = totalStudents > 0
                    ? (float)Math.Round((double)totalSubmissions / totalStudents * 100, 2)
                    : 0f;

                var passingScoreThreshold = 5f;
                var passRate = scores.Count > 0
                    ? (float)Math.Round((double)scores.Count(s => s >= passingScoreThreshold) / scores.Count * 100, 2)
                    : 0f;

                var scoreDistribution = scores
                    .GroupBy(s => GetScoreRange(s))
                    .Select(g => new ExamScoreDistributionItem
                    {
                        Range = g.Key,
                        Count = g.Count(),
                        Percentage = (float)Math.Round((double)g.Count() / scores.Count * 100, 2)
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                if (scoreDistribution.Count == 0)
                {
                    scoreDistribution = GetDefaultExamScoreDistribution();
                }

                result.Add(new ExamScoreStatisticsItem
                {
                    ExamId = exam.Id,
                    ExamName = exam.ExamName,
                    TotalMark = exam.TotalMark,
                    AverageScore = (float)Math.Round(averageScore, 2),
                    HighestScore = (float)Math.Round(highestScore, 2),
                    LowestScore = (float)Math.Round(lowestScore, 2),
                    MedianScore = (float)Math.Round(medianScore, 2),
                    TotalSubmissions = totalSubmissions,
                    TotalStudents = totalStudents,
                    SubmissionRate = submissionRate,
                    PassRate = passRate,
                    StartDatetime = exam.StartDatetime,
                    EndDatetime = exam.EndDatetime,
                    ScoreDistribution = scoreDistribution
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting exam score statistics for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    private static float CalculateMedian(List<float> sortedScores)
    {
        if (sortedScores.Count == 0) return 0f;

        int count = sortedScores.Count;
        if (count % 2 == 0)
        {
            return (sortedScores[count / 2 - 1] + sortedScores[count / 2]) / 2f;
        }
        return sortedScores[count / 2];
    }

    private static List<ExamScoreDistributionItem> GetDefaultExamScoreDistribution()
    {
        return new List<ExamScoreDistributionItem>
        {
            new() { Range = "9-10", Count = 0, Percentage = 0 },
            new() { Range = "7-8", Count = 0, Percentage = 0 },
            new() { Range = "5-6", Count = 0, Percentage = 0 },
            new() { Range = "3-4", Count = 0, Percentage = 0 },
            new() { Range = "0-2", Count = 0, Percentage = 0 }
        };
    }

    private static string GetScoreRange(float score)
    {
        if (score >= 9) return "9-10";
        if (score >= 7) return "7-8";
        if (score >= 5) return "5-6";
        if (score >= 3) return "3-4";
        return "0-2";
    }

    private static string GetRiskLevel(float averageScore)
    {
        if (averageScore < 3) return "HIGH";
        if (averageScore < 5) return "MEDIUM";
        return "LOW";
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

    private static List<ScoreDistributionItem> GetDefaultScoreDistribution()
    {
        return new List<ScoreDistributionItem>
        {
            new() { Range = "9-10", Count = 0, Percentage = 0 },
            new() { Range = "7-8", Count = 0, Percentage = 0 },
            new() { Range = "5-6", Count = 0, Percentage = 0 },
            new() { Range = "3-4", Count = 0, Percentage = 0 },
            new() { Range = "0-2", Count = 0, Percentage = 0 }
        };
    }
}
