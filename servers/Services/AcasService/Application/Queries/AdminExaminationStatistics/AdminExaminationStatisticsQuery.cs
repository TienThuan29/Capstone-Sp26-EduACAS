using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Examination;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.Submission;
using AcasService.Repositories.Subject;

namespace AcasService.Application.Queries.AdminExaminationStatistics;

public interface IAdminExaminationStatisticsQuery
{
    Task<ResponseDTOs.AdminExaminationStatisticsResponse> GetExaminationStatisticsAsync(CancellationToken cancellationToken = default);
    Task<ResponseDTOs.SubmissionByLanguageResponse> GetSubmissionByLanguageAsync(CancellationToken cancellationToken = default);
    Task<ResponseDTOs.StudentLecturerRatioResponse> GetStudentLecturerRatioAsync(CancellationToken cancellationToken = default);
    Task<ResponseDTOs.UsersBySubjectResponse> GetUsersBySubjectAsync(CancellationToken cancellationToken = default);
}


public class AdminExaminationStatisticsQuery : IAdminExaminationStatisticsQuery
{
    private readonly ILogger<AdminExaminationStatisticsQuery> _logger;
    private readonly IExaminationRepository _examinationRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;
    private readonly IProgrammingLanguageRepository _programmingLanguageRepository;
    private readonly ISubjectRepository _subjectRepository;
    private const float PassScoreThreshold = 5f;

    public AdminExaminationStatisticsQuery(
        ILogger<AdminExaminationStatisticsQuery> logger,
        IExaminationRepository examinationRepository,
        ISubmissionRepository submissionRepository,
        IClassroomRepository classroomRepository,
        IClassroomEnrollmentRepository classroomEnrollmentRepository,
        IProgrammingLanguageRepository programmingLanguageRepository,
        ISubjectRepository subjectRepository)
    {
        _logger = logger;
        _examinationRepository = examinationRepository;
        _submissionRepository = submissionRepository;
        _classroomRepository = classroomRepository;
        _classroomEnrollmentRepository = classroomEnrollmentRepository;
        _programmingLanguageRepository = programmingLanguageRepository;
        _subjectRepository = subjectRepository;
    }

    public async Task<AdminExaminationStatisticsResponse> GetExaminationStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var examEntities = await _examinationRepository.GetAllAsync();
            var examinations = examEntities.Where(e => e != null).Cast<AcasService.Models.Examination>().ToList();
            var allSubmissions = await _submissionRepository.GetAllAsync();
            var classrooms = await _classroomRepository.FindAllAsync();
            var allClassrooms = classrooms.ToDictionary(c => c.Id, c => c);
            var allEnrollments = await _classroomEnrollmentRepository.FindByAllAsync();

            var activeExaminations = examinations.Count(e => e.Status == Status.ONGOING);
            var completedExaminations = examinations.Count(e => e.Status == Status.COMPLETED);
            var pendingExaminations = examinations.Count(e => e.Status == Status.PENDING);
            var practicalExaminations = examinations.Count(e => e.Mode == Mode.PRACTICAL);
            var examinationModeExaminations = examinations.Count(e => e.Mode == Mode.EXAMINATION);

            var totalSubmissions = allSubmissions.Count;
            var uniqueStudentIds = allSubmissions.Select(s => s.StudentId).Distinct().ToList();
            var totalStudentsWithSubmissions = uniqueStudentIds.Count;

            var totalEnrolledStudents = allEnrollments.Select(e => e.StudentId).Distinct().Count();
            var submissionRate = totalEnrolledStudents > 0
                ? (float)Math.Round((double)totalStudentsWithSubmissions / totalEnrolledStudents * 100, 2)
                : 0f;

            var latestSubmissionsByStudentAndExam = allSubmissions
                .GroupBy(s => new { s.StudentId, s.ExamId })
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .ToList();

            var gradedSubmissions = latestSubmissionsByStudentAndExam
                .Where(s => s.Status == SubmissionStatus.GRADED)
                .ToList();

            var allScores = gradedSubmissions.Select(s => s.FinalScore).ToList();
            var overallAverageScore = allScores.Count > 0 ? (float)Math.Round(allScores.Average(), 2) : 0f;
            var passingScoresCount = allScores.Count(s => s >= PassScoreThreshold);
            var overallPassRate = allScores.Count > 0
                ? (float)Math.Round((double)passingScoresCount / allScores.Count * 100, 2)
                : 0f;

            var examIds = examinations.Select(e => e.Id).ToHashSet();
            var submissionsByExam = gradedSubmissions
                .Where(s => examIds.Contains(s.ExamId))
                .GroupBy(s => s.ExamId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var enrollmentsByClass = allEnrollments
                .GroupBy(e => e.ClassId)
                .ToDictionary(g => g.Key, g => g.Select(e => e.StudentId).Distinct().ToList());

            var examList = new List<ExaminationListItem>();
            foreach (var exam in examinations)
            {
                var examSubmissions = submissionsByExam.GetValueOrDefault(exam.Id) ?? new List<Models.Submission>();
                var latestByStudent = examSubmissions
                    .GroupBy(s => s.StudentId)
                    .Select(g => g.OrderByDescending(s => s.Version).First())
                    .ToList();

                var enrolledInClass = enrollmentsByClass.GetValueOrDefault(exam.ClassroomId) ?? new List<string>();
                var totalStudentsInClass = enrolledInClass.Count;

                var examScores = latestByStudent.Select(s => s.FinalScore).ToList();
                var examAvg = examScores.Count > 0 ? (float)Math.Round(examScores.Average(), 2) : 0f;
                var examPassingCount = examScores.Count(s => s >= PassScoreThreshold);
                var examPassRate = examScores.Count > 0
                    ? (float)Math.Round((double)examPassingCount / examScores.Count * 100, 2)
                    : 0f;

                allClassrooms.TryGetValue(exam.ClassroomId, out var classroom);

                examList.Add(new ExaminationListItem
                {
                    ExamId = exam.Id,
                    ExamName = exam.ExamName,
                    ClassroomId = exam.ClassroomId,
                    ClassroomName = classroom?.ClassName ?? string.Empty,
                    Mode = exam.Mode.ToString().ToUpperInvariant(),
                    Status = exam.Status.ToString().ToUpperInvariant(),
                    TotalMark = exam.TotalMark,
                    AverageScore = examAvg,
                    TotalSubmissions = latestByStudent.Count,
                    TotalStudents = totalStudentsInClass,
                    PassRate = examPassRate,
                    StartDatetime = exam.StartDatetime,
                    EndDatetime = exam.EndDatetime
                });
            }

            return new AdminExaminationStatisticsResponse
            {
                TotalExaminations = examinations.Count,
                ActiveExaminations = activeExaminations,
                CompletedExaminations = completedExaminations,
                PendingExaminations = pendingExaminations,
                PracticalExaminations = practicalExaminations,
                ExaminationModeExaminations = examinationModeExaminations,
                TotalSubmissions = totalSubmissions,
                TotalStudentsWithSubmissions = totalStudentsWithSubmissions,
                OverallPassRate = overallPassRate,
                OverallAverageScore = overallAverageScore,
                SubmissionRate = submissionRate,
                ExaminationList = examList
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin examination statistics");
            throw;
        }
    }

    public async Task<SubmissionByLanguageResponse> GetSubmissionByLanguageAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var allSubmissions = await _submissionRepository.GetAllAsync();
            var languageEntities = await _programmingLanguageRepository.GetAllAsync();
            var languages = languageEntities.ToList();

            var languageMap = languages.ToDictionary(l => l.Id, l => l.Name);

            var gradedSubmissions = allSubmissions
                .Where(s => s.Status == SubmissionStatus.GRADED)
                .ToList();

            var totalSubmissions = gradedSubmissions.Count;

            var groupedByLanguage = gradedSubmissions
                .GroupBy(s => s.LanguageId)
                .Select(g =>
                {
                    var scores = g.Select(s => s.FinalScore).ToList();
                    var passing = scores.Count(s => s >= PassScoreThreshold);
                    var avg = scores.Count > 0 ? (float)Math.Round(scores.Average(), 2) : 0f;
                    var passRate = scores.Count > 0
                        ? (float)Math.Round((double)passing / scores.Count * 100, 2)
                        : 0f;

                    return new SubmissionByLanguageItem
                    {
                        LanguageId = g.Key,
                        LanguageName = languageMap.GetValueOrDefault(g.Key, "Unknown"),
                        TotalSubmissions = g.Count(),
                        UniqueStudents = g.Select(s => s.StudentId).Distinct().Count(),
                        Percentage = totalSubmissions > 0
                            ? (float)Math.Round((double)g.Count() / totalSubmissions * 100, 2)
                            : 0f,
                        AverageScore = avg,
                        PassRate = passRate
                    };
                })
                .OrderByDescending(x => x.TotalSubmissions)
                .ToList();

            return new SubmissionByLanguageResponse
            {
                TotalSubmissions = totalSubmissions,
                TotalLanguages = groupedByLanguage.Count,
                TopLanguage = groupedByLanguage.FirstOrDefault()?.LanguageName ?? string.Empty,
                LanguageBreakdown = groupedByLanguage
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting submission by language statistics");
            throw;
        }
    }

    public async Task<StudentLecturerRatioResponse> GetStudentLecturerRatioAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var classrooms = await _classroomRepository.FindAllAsync();
            var allEnrollments = await _classroomEnrollmentRepository.FindByAllAsync();

            var uniqueStudents = allEnrollments
                .Where(e => e.IsJoining)
                .Select(e => e.StudentId)
                .Distinct()
                .Count();

            var uniqueLecturers = classrooms
                .Select(c => c.LecturerId)
                .Where(id => !string.IsNullOrEmpty(id))
                .Distinct()
                .Count();

            var totalEnrollments = allEnrollments.Count(e => e.IsJoining);

            var ratioDecimal = uniqueLecturers > 0
                ? (float)Math.Round((double)uniqueStudents / uniqueLecturers, 2)
                : 0f;

            return new StudentLecturerRatioResponse
            {
                TotalStudents = uniqueStudents,
                TotalLecturers = uniqueLecturers,
                Ratio = $"{uniqueStudents}:{uniqueLecturers}",
                RatioDecimal = ratioDecimal,
                TotalClassrooms = classrooms.Count,
                TotalEnrollments = totalEnrollments
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student lecturer ratio");
            throw;
        }
    }

    public async Task<UsersBySubjectResponse> GetUsersBySubjectAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var subjects = await _subjectRepository.FindAllAsync();
            var classrooms = await _classroomRepository.FindAllAsync();
            var allEnrollments = await _classroomEnrollmentRepository.FindByAllAsync();

            var activeEnrollments = allEnrollments.Where(e => e.IsJoining).ToList();

            var classroomsBySubject = classrooms
                .GroupBy(c => c.SubjectId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var lecturerCountBySubject = classrooms
                .Where(c => !string.IsNullOrEmpty(c.LecturerId))
                .GroupBy(c => c.SubjectId)
                .ToDictionary(g => g.Key, g => g.Select(c => c.LecturerId).Distinct().Count());

            var enrollmentsBySubject = classroomsBySubject
                .Select(kvp =>
                {
                    var classIds = kvp.Value.Select(c => c.Id).ToHashSet();
                    return new
                    {
                        SubjectId = kvp.Key,
                        StudentCount = activeEnrollments
                            .Count(e => classIds.Contains(e.ClassId))
                    };
                })
                .ToDictionary(x => x.SubjectId, x => x.StudentCount);

            var totalStudents = activeEnrollments.Select(e => e.StudentId).Distinct().Count();

            var distribution = subjects
                .Select(s =>
                {
                    enrollmentsBySubject.TryGetValue(s.Id, out var studentCount);
                    classroomsBySubject.TryGetValue(s.Id, out var classes);
                    lecturerCountBySubject.TryGetValue(s.Id, out var lecturerCount);

                    return new SubjectStudentDistributionItem
                    {
                        SubjectId = s.Id,
                        SubjectCode = s.SubjectCode,
                        SubjectName = s.SubjectName,
                        TotalStudents = studentCount,
                        TotalClasses = classes?.Count ?? 0,
                        TotalLecturers = lecturerCount,
                        Percentage = totalStudents > 0
                            ? (float)Math.Round((double)studentCount / totalStudents * 100, 2)
                            : 0f
                    };
                })
                .OrderByDescending(x => x.TotalStudents)
                .ToList();

            return new UsersBySubjectResponse
            {
                TotalStudents = totalStudents,
                TotalSubjects = subjects.Count,
                Distribution = distribution
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users by subject statistics");
            throw;
        }
    }
}
