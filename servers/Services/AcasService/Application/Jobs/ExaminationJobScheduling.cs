using Hangfire;
using AcasService.Models;
using AcasService.Repositories.Examination;

namespace AcasService.Application.Jobs;

/// <summary>
/// Service responsible for scheduling and managing examination status transition jobs
/// using Hangfire delayed jobs backed by Redis.
/// </summary>
public interface IExaminationJobScheduling
{
    /// <summary>
    /// Schedules two jobs for an examination:
    ///   1. Open job  — transitions PENDING → ONGOING at StartDatetime
    ///   2. Complete job — transitions ONGOING → COMPLETED at EndDatetime
    /// Both are fire-and-forget delayed jobs stored in Redis via Hangfire.
    /// </summary>
    void ScheduleJobs(string examId, DateTime startDatetime, DateTime endDatetime);

    /// <summary>
    /// Cancels any previously scheduled open and complete jobs for the given exam.
    /// Called when the exam is deleted or its dates change (update flow).
    /// </summary>
    void CancelJobs(string examId);

    /// <summary>
    /// Reschedules jobs for an exam when StartDatetime or EndDatetime changes.
    /// Internally calls CancelJobs then ScheduleJobs with the new dates.
    /// </summary>
    void RescheduleJobs(string examId, DateTime newStartDatetime, DateTime newEndDatetime);
}

/// <summary>
/// Hangfire job class — each public method becomes a background job entry point.
/// Instances are created by the DI container so all repository dependencies are resolved.
/// </summary>
public class ExaminationJobScheduling : IExaminationJobScheduling
{
    private readonly IExaminationRepository _examinationRepository;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<ExaminationJobScheduling> _logger;

    public ExaminationJobScheduling(
        IExaminationRepository examinationRepository,
        IBackgroundJobClient backgroundJobClient,
        ILogger<ExaminationJobScheduling> logger)
    {
        _examinationRepository = examinationRepository;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public void ScheduleJobs(string examId, DateTime startDatetime, DateTime endDatetime)
    {
        if (string.IsNullOrWhiteSpace(examId))
            throw new ArgumentNullException(nameof(examId));

        // Normalize to UTC kind so all comparisons are consistent
        var startUtc = EnsureUtc(startDatetime);
        var endUtc = EnsureUtc(endDatetime);

        if (startUtc > endUtc)
            throw new ArgumentException(
                $"StartDatetime ({startUtc}) must not be after EndDatetime ({endUtc}).",
                nameof(startDatetime));

        // Safety guard: do not schedule jobs for past exams
        var now = DateTime.UtcNow;

        if (endUtc <= now)
        {
            _logger.LogWarning(
                "Exam {ExamId} EndDatetime {EndDatetime} is not in the future. " +
                "Skipping job scheduling. Exam may already be expired.",
                examId, endUtc);
            return;
        }

        // --- Job 1: Open exam at StartDatetime ---
        // Use >= so an exam created at or very slightly before StartDatetime still gets a job.
        // A zero or tiny delay fires immediately (Hangfire handles this correctly).
        if (startUtc >= now)
        {
            var openDelay = startUtc - now;
            var openJobId = _backgroundJobClient.Schedule<ExaminationJobScheduling>(
                job => job.MarkExamAsOpenAsync(examId),
                openDelay);

            _logger.LogInformation(
                "Scheduled OPEN job for exam {ExamId} at {StartDatetime} " +
                "(delay: {Delay}, JobId: {JobId})",
                examId, startUtc, openDelay, openJobId);
        }
        else
        {
            // Exam already past its start time — fire OPEN immediately so it transitions without delay.
            var openJobId = _backgroundJobClient.Schedule<ExaminationJobScheduling>(
                job => job.MarkExamAsOpenAsync(examId),
                TimeSpan.Zero);

            _logger.LogInformation(
                "Exam {ExamId} StartDatetime {StartDatetime} is in the past. " +
                "OPEN job scheduled immediately (JobId: {JobId}).",
                examId, startUtc, openJobId);
        }

        // --- Job 2: Complete exam at EndDatetime ---
        var completeDelay = endUtc - now;
        var completeJobId = _backgroundJobClient.Schedule<ExaminationJobScheduling>(
            job => job.MarkExamAsCompletedAsync(examId),
            completeDelay);

        _logger.LogInformation(
            "Scheduled COMPLETE job for exam {ExamId} at {EndDatetime} " +
            "(delay: {Delay}, JobId: {JobId})",
            examId, endUtc, completeDelay, completeJobId);
    }

    /// <summary>
    /// Ensures a DateTime is in UTC kind. If Kind is Unspecified (e.g. from JSON deserialization
    /// or DynamoDB round-trip), treats it as UTC. If Kind is Local, converts to UTC.
    /// </summary>
    private static DateTime EnsureUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        };
    }

    public void CancelJobs(string examId)
    {
        var openJobId = GetOpenJobId(examId);
        var completeJobId = GetCompleteJobId(examId);

        bool openDeleted = _backgroundJobClient.Delete(openJobId);
        bool completeDeleted = _backgroundJobClient.Delete(completeJobId);

        _logger.LogInformation(
            "Cancelled jobs for exam {ExamId}: open={OpenDeleted}, complete={CompleteDeleted}",
            examId, openDeleted, completeDeleted);
    }

    public void RescheduleJobs(string examId, DateTime newStartDatetime, DateTime newEndDatetime)
    {
        CancelJobs(examId);
        ScheduleJobs(examId, newStartDatetime, newEndDatetime);
    }

    // ================================================================
    // Hangfire job entry points — must be public instance methods
    // ================================================================

    /// <summary>
    /// Hangfire job: transitions exam status from PENDING to ONGOING.
    /// Only transitions if the current status is PENDING (idempotent).
    /// </summary>
    public async Task MarkExamAsOpenAsync(string examId)
    {
        try
        {
            var exam = await _examinationRepository.GetByIdAsync(examId);
            if (exam == null)
            {
                _logger.LogWarning(
                    "OPEN job failed: Examination {ExamId} not found", examId);
                return;
            }

            _logger.LogInformation(
                "OPEN job triggered: examId={ExamId}, status={Status}, " +
                "StartDatetime={Start}Z, EndDatetime={End}Z, now={Now}Z",
                examId, exam.Status,
                exam.StartDatetime.ToString("O"),
                exam.EndDatetime.ToString("O"),
                DateTime.UtcNow.ToString("O"));

            if (exam.Status == Status.ONGOING)
            {
                _logger.LogInformation(
                    "OPEN job skipped: Exam {ExamId} is already ONGOING", examId);
                return;
            }

            if (exam.Status == Status.COMPLETED)
            {
                _logger.LogInformation(
                    "OPEN job skipped: Exam {ExamId} is already COMPLETED", examId);
                return;
            }

            exam.Status = Status.ONGOING;
            exam.UpdatedDate = DateTime.UtcNow;
            await _examinationRepository.UpdateAsync(examId, exam);

            _logger.LogInformation(
                "Exam {ExamId} ('{ExamName}') transitioned to ONGOING",
                examId, exam.ExamName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "OPEN job failed for examination {ExamId}. Will NOT retry.", examId);
            throw; // Re-throw so Hangfire marks the job as failed
        }
    }

    /// <summary>
    /// Hangfire job: transitions exam status from ONGOING to COMPLETED.
    /// Idempotent — safe to call even if exam is already COMPLETED.
    /// </summary>
    public async Task MarkExamAsCompletedAsync(string examId)
    {
        try
        {
            var exam = await _examinationRepository.GetByIdAsync(examId);
            if (exam == null)
            {
                _logger.LogWarning(
                    "COMPLETE job failed: Examination {ExamId} not found", examId);
                return;
            }

            _logger.LogInformation(
                "COMPLETE job triggered: examId={ExamId}, status={Status}, " +
                "StartDatetime={Start}Z, EndDatetime={End}Z, now={Now}Z",
                examId, exam.Status,
                exam.StartDatetime.ToString("O"),
                exam.EndDatetime.ToString("O"),
                DateTime.UtcNow.ToString("O"));

            if (exam.Status == Status.COMPLETED)
            {
                _logger.LogInformation(
                    "COMPLETE job skipped: Exam {ExamId} is already COMPLETED", examId);
                return;
            }

            exam.Status = Status.COMPLETED;
            exam.UpdatedDate = DateTime.UtcNow;
            await _examinationRepository.UpdateAsync(examId, exam);

            _logger.LogInformation(
                "Exam {ExamId} ('{ExamName}') transitioned to COMPLETED",
                examId, exam.ExamName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "COMPLETE job failed for examination {ExamId}. Will NOT retry.", examId);
            throw; // Re-throw so Hangfire marks the job as failed
        }
    }

    // ================================================================
    // Job ID helpers — used for cancellation and deletion
    // ================================================================

    private static string GetOpenJobId(string examId) =>
        $"exam-open:{examId}";

    private static string GetCompleteJobId(string examId) =>
        $"exam-complete:{examId}";
}
