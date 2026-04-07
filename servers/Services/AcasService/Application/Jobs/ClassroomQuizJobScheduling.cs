using Hangfire;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;

namespace AcasService.Application.Jobs;

/// <summary>
/// Service responsible for scheduling and managing classroom quiz status transition jobs
/// using Hangfire delayed jobs backed by Redis.
/// </summary>
public interface IClassroomQuizJobScheduling
{
    /// <summary>
    /// Schedules two jobs for a classroom quiz:
    ///   1. Open job  — transitions DRAFT -> PUBLISHED at StartTime
    ///   2. Close job — transitions PUBLISHED -> CLOSED at EndTime
    /// </summary>
    void ScheduleJobs(string classroomQuizId, DateTime startTime, DateTime endTime);

    /// <summary>
    /// Cancels previously scheduled open and close jobs for the given classroom quiz.
    /// </summary>
    void CancelJobs(string classroomQuizId);

    /// <summary>
    /// Reschedules jobs when start/end time changes.
    /// </summary>
    void RescheduleJobs(string classroomQuizId, DateTime newStartTime, DateTime newEndTime);
}

public class ClassroomQuizJobScheduling : IClassroomQuizJobScheduling
{
    private readonly IClassroomQuizRepository _repository;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<ClassroomQuizJobScheduling> _logger;

    public ClassroomQuizJobScheduling(
        IClassroomQuizRepository repository,
        IBackgroundJobClient backgroundJobClient,
        ILogger<ClassroomQuizJobScheduling> logger)
    {
        _repository = repository;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public void ScheduleJobs(string classroomQuizId, DateTime startTime, DateTime endTime)
    {
        var startUtc = EnsureUtc(startTime);
        var endUtc = EnsureUtc(endTime);
        var now = DateTime.UtcNow;

        if (endUtc <= now)
        {
            _logger.LogWarning(
                "ClassroomQuiz {ClassroomQuizId} EndTime {EndTime} is not in the future. Skipping job scheduling.",
                classroomQuizId,
                endUtc);
            return;
        }

        if (startUtc >= now)
        {
            var openDelay = startUtc - now;
            var openJobId = _backgroundJobClient.Schedule<ClassroomQuizJobScheduling>(
                job => job.MarkQuizAsOpenAsync(classroomQuizId),
                openDelay);

            _logger.LogInformation(
                "Scheduled OPEN job for classroom quiz {ClassroomQuizId} at {StartTime} (delay: {Delay}, JobId: {JobId})",
                classroomQuizId, startUtc, openDelay, openJobId);
        }
        else
        {
            var openJobId = _backgroundJobClient.Schedule<ClassroomQuizJobScheduling>(
                job => job.MarkQuizAsOpenAsync(classroomQuizId),
                TimeSpan.Zero);

            _logger.LogInformation(
                "ClassroomQuiz {ClassroomQuizId} StartTime {StartTime} is in the past. OPEN job scheduled immediately (JobId: {JobId}).",
                classroomQuizId, startUtc, openJobId);
        }

        var closeDelay = endUtc - now;
        var closeJobId = _backgroundJobClient.Schedule<ClassroomQuizJobScheduling>(
            job => job.MarkQuizAsClosedAsync(classroomQuizId),
            closeDelay);

        _logger.LogInformation(
            "Scheduled CLOSE job for classroom quiz {ClassroomQuizId} at {EndTime} (delay: {Delay}, JobId: {JobId})",
            classroomQuizId, endUtc, closeDelay, closeJobId);
    }

    public void CancelJobs(string classroomQuizId)
    {
        var openJobId = GetOpenJobId(classroomQuizId);
        var closeJobId = GetCloseJobId(classroomQuizId);

        var openDeleted = _backgroundJobClient.Delete(openJobId);
        var closeDeleted = _backgroundJobClient.Delete(closeJobId);

        _logger.LogInformation(
            "Cancelled jobs for classroom quiz {ClassroomQuizId}: open={OpenDeleted}, close={CloseDeleted}",
            classroomQuizId, openDeleted, closeDeleted);
    }

    public void RescheduleJobs(string classroomQuizId, DateTime newStartTime, DateTime newEndTime)
    {
        CancelJobs(classroomQuizId);
        ScheduleJobs(classroomQuizId, newStartTime, newEndTime);
    }

    public async Task MarkQuizAsOpenAsync(string classroomQuizId)
    {
        try
        {
            var quiz = await _repository.FindByIdAsync(classroomQuizId);
            if (quiz == null)
            {
                _logger.LogWarning("OPEN job failed: ClassroomQuiz {ClassroomQuizId} not found", classroomQuizId);
                return;
            }

            if (quiz.Status == ClassroomQuizStatus.PUBLISHED)
            {
                _logger.LogInformation("OPEN job skipped: ClassroomQuiz {ClassroomQuizId} is already PUBLISHED", classroomQuizId);
                return;
            }

            if (quiz.Status == ClassroomQuizStatus.CLOSED)
            {
                _logger.LogInformation("OPEN job skipped: ClassroomQuiz {ClassroomQuizId} is already CLOSED", classroomQuizId);
                return;
            }

            quiz.Status = ClassroomQuizStatus.PUBLISHED;
            quiz.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(quiz);

            _logger.LogInformation("ClassroomQuiz {ClassroomQuizId} transitioned to PUBLISHED", classroomQuizId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OPEN job failed for classroom quiz {ClassroomQuizId}", classroomQuizId);
            throw;
        }
    }

    public async Task MarkQuizAsClosedAsync(string classroomQuizId)
    {
        try
        {
            var quiz = await _repository.FindByIdAsync(classroomQuizId);
            if (quiz == null)
            {
                _logger.LogWarning("CLOSE job failed: ClassroomQuiz {ClassroomQuizId} not found", classroomQuizId);
                return;
            }

            if (quiz.Status == ClassroomQuizStatus.CLOSED)
            {
                _logger.LogInformation("CLOSE job skipped: ClassroomQuiz {ClassroomQuizId} is already CLOSED", classroomQuizId);
                return;
            }

            quiz.Status = ClassroomQuizStatus.CLOSED;
            quiz.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(quiz);

            _logger.LogInformation("ClassroomQuiz {ClassroomQuizId} transitioned to CLOSED", classroomQuizId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CLOSE job failed for classroom quiz {ClassroomQuizId}", classroomQuizId);
            throw;
        }
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        };
    }

    private static string GetOpenJobId(string classroomQuizId) =>
        $"classroom-quiz-open:{classroomQuizId}";

    private static string GetCloseJobId(string classroomQuizId) =>
        $"classroom-quiz-close:{classroomQuizId}";
}
