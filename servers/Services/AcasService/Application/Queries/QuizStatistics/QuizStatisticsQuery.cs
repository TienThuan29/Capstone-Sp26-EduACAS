using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.Quiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Repositories.ClassroomEnrollment;
using QuizModel = AcasService.Models.Quiz;

namespace AcasService.Application.Queries.QuizStatistics;

public interface IQuizStatisticsQuery
{
    Task<List<QuizScoreStatisticsItem>> GetQuizScoreStatisticsAsync(string classroomId);
}

public class QuizStatisticsQuery : IQuizStatisticsQuery
{
    private readonly ILogger<QuizStatisticsQuery> _logger;
    private readonly IClassroomQuizRepository _classroomQuizRepository;
    private readonly IQuizRepository _quizRepository;
    private readonly IQuizAttemptRepository _quizAttemptRepository;
    private readonly IClassroomEnrollmentRepository _classEnrollmentRepository;

    private const float PassThreshold = 5f;

    public QuizStatisticsQuery(
        ILogger<QuizStatisticsQuery> logger,
        IClassroomQuizRepository classroomQuizRepository,
        IQuizRepository quizRepository,
        IQuizAttemptRepository quizAttemptRepository,
        IClassroomEnrollmentRepository classEnrollmentRepository)
    {
        _logger = logger;
        _classroomQuizRepository = classroomQuizRepository;
        _quizRepository = quizRepository;
        _quizAttemptRepository = quizAttemptRepository;
        _classEnrollmentRepository = classEnrollmentRepository;
    }

    public async Task<List<QuizScoreStatisticsItem>> GetQuizScoreStatisticsAsync(string classroomId)
    {
        try
        {
            var classroomQuizzes = await _classroomQuizRepository.FindByClassroomIdAsync(classroomId, includeDrafts: false);

            if (classroomQuizzes.Count == 0)
            {
                _logger.LogInformation("No classroom quizzes found for classroom {ClassroomId}", classroomId);
                return new List<QuizScoreStatisticsItem>();
            }

            var enrollments = await _classEnrollmentRepository.FindByClassIdAsync(classroomId);
            var totalStudents = enrollments.Select(e => e.StudentId).Distinct().Count();

            if (totalStudents == 0)
            {
                _logger.LogInformation("No enrolled students found for classroom {ClassroomId}", classroomId);
                return new List<QuizScoreStatisticsItem>();
            }

            var quizMap = new Dictionary<string, QuizModel>();
            var quizIds = classroomQuizzes.Select(cq => cq.QuizId).Distinct().ToList();
            foreach (var quizId in quizIds)
            {
                var quiz = await _quizRepository.FindByIdAsync(quizId);
                if (quiz != null)
                {
                    quizMap[quizId] = quiz;
                }
            }

            var result = new List<QuizScoreStatisticsItem>();

            foreach (var classroomQuiz in classroomQuizzes.OrderBy(cq => cq.StartTime))
            {
                var quiz = quizMap.GetValueOrDefault(classroomQuiz.QuizId);
                var quizTitle = quiz?.Title ?? string.Empty;

                var attempts = await _quizAttemptRepository.FindByClassroomQuizIdAsync(classroomQuiz.Id);

                var submittedAttempts = attempts
                    .Where(a => a.Status == QuizAttemptStatus.SUBMITTED && a.FinalScore.HasValue)
                    .ToList();

                var scores = submittedAttempts
                    .Select(a => (float)a.FinalScore!.Value)
                    .OrderBy(s => s)
                    .ToList();

                var latestByStudent = submittedAttempts
                    .GroupBy(a => a.StudentId)
                    .Select(g => g.OrderByDescending(a => a.AttemptNumber).First())
                    .ToList();

                if (latestByStudent.Count == 0)
                {
                    result.Add(new QuizScoreStatisticsItem
                    {
                        QuizId = classroomQuiz.QuizId,
                        ClassroomQuizId = classroomQuiz.Id,
                        QuizTitle = quizTitle,
                        AverageScore = 0,
                        HighestScore = 0,
                        LowestScore = 0,
                        MedianScore = 0,
                        TotalSubmissions = 0,
                        TotalStudents = totalStudents,
                        TotalAttempts = submittedAttempts.Count,
                        SubmissionRate = 0,
                        PassRate = 0,
                        StartTime = classroomQuiz.StartTime,
                        EndTime = classroomQuiz.EndTime,
                        ScoreDistribution = GetDefaultScoreDistribution()
                    });
                    continue;
                }

                var latestScores = latestByStudent.Select(a => (float)a.FinalScore!.Value).ToList();
                var avgScore = latestScores.Average();
                var highScore = latestScores.Max();
                var lowScore = latestScores.Min();
                var medianScore = CalculateMedian(latestScores);

                var submissionRate = (float)Math.Round((double)latestByStudent.Count / totalStudents * 100, 2);
                var passCount = latestScores.Count(s => s >= PassThreshold);
                var passRate = (float)Math.Round((double)passCount / latestByStudent.Count * 100, 2);

                var scoreDistribution = latestScores
                    .GroupBy(s => GetScoreRange(s))
                    .Select(g => new ScoreDistributionItem
                    {
                        Range = g.Key,
                        Count = g.Count(),
                        Percentage = (float)Math.Round((double)g.Count() / latestScores.Count * 100, 2)
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                if (scoreDistribution.Count == 0)
                {
                    scoreDistribution = GetDefaultScoreDistribution();
                }

                result.Add(new QuizScoreStatisticsItem
                {
                    QuizId = classroomQuiz.QuizId,
                    ClassroomQuizId = classroomQuiz.Id,
                    QuizTitle = quizTitle,
                    AverageScore = (float)Math.Round(avgScore, 2),
                    HighestScore = (float)Math.Round(highScore, 2),
                    LowestScore = (float)Math.Round(lowScore, 2),
                    MedianScore = (float)Math.Round(medianScore, 2),
                    TotalSubmissions = latestByStudent.Count,
                    TotalStudents = totalStudents,
                    TotalAttempts = submittedAttempts.Count,
                    SubmissionRate = submissionRate,
                    PassRate = passRate,
                    StartTime = classroomQuiz.StartTime,
                    EndTime = classroomQuiz.EndTime,
                    ScoreDistribution = scoreDistribution
                });
            }

            _logger.LogInformation(
                "Retrieved quiz statistics for {Count} quizzes in classroom {ClassroomId}",
                result.Count, classroomId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quiz score statistics for classroom {ClassroomId}", classroomId);
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

    private static string GetScoreRange(float score)
    {
        if (score >= 9) return "9-10";
        if (score >= 7) return "7-8";
        if (score >= 5) return "5-6";
        if (score >= 3) return "3-4";
        return "0-2";
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
