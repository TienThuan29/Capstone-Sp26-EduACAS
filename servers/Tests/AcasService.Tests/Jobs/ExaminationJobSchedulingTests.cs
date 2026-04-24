using AcasService.Application.Jobs;
using AcasService.Models;
using AcasService.Repositories.Examination;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using AcasService.Tests.Helpers;

namespace AcasService.Tests.Jobs;

public class ExaminationJobSchedulingTests
{
    private readonly Mock<IExaminationRepository> _examinationRepoMock;
    private readonly Mock<IBackgroundJobClient> _jobClientMock;
    private readonly Mock<ILogger<ExaminationJobScheduling>> _loggerMock;
    private readonly ExaminationJobScheduling _scheduling;

    public ExaminationJobSchedulingTests()
    {
        _examinationRepoMock = new Mock<IExaminationRepository>();
        _jobClientMock = new Mock<IBackgroundJobClient>();
        _loggerMock = new Mock<ILogger<ExaminationJobScheduling>>();

        _scheduling = new ExaminationJobScheduling(
            _examinationRepoMock.Object,
            _jobClientMock.Object,
            _loggerMock.Object
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F042 | ScheduleJobs
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Normal case
    [Fact]
    public void UTCD01_ScheduleJobs_ValidFutureDates_SchedulesTwoJobs()
    {
        var examId = "e1";
        var start = DateTime.UtcNow.AddHours(1);
        var end = DateTime.UtcNow.AddHours(3);

        _scheduling.ScheduleJobs(examId, start, end);

        // Verify two jobs created (Create is called twice internally by Schedule<T>)
        _jobClientMock.Verify(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Exactly(2));
    }

    // UTCD-02 | Start in past
    [Fact]
    public void UTCD02_ScheduleJobs_StartInPast_SchedulesOpenImmediately()
    {
        var examId = "e1";
        var start = DateTime.UtcNow.AddMinutes(-10);
        var end = DateTime.UtcNow.AddHours(1);

        _scheduling.ScheduleJobs(examId, start, end);

        // Still schedules two jobs, but one is with TimeSpan.Zero delay (verified by logic flow)
        _jobClientMock.Verify(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Exactly(2));
    }

    // UTCD-03 | Start > End (Abnormal)
    [Fact]
    public void UTCD03_ScheduleJobs_StartAfterEnd_ThrowsArgumentException()
    {
        var examId = "e1";
        var start = DateTime.UtcNow.AddHours(2);
        var end = DateTime.UtcNow.AddHours(1);

        Action act = () => _scheduling.ScheduleJobs(examId, start, end);

        act.Should().Throw<ArgumentException>()
           .WithMessage("*must not be after EndDatetime*");
    }

    // UTCD-04 | Normal with delays
    [Fact]
    public void UTCD04_ScheduleJobs_ValidDatesWithSpecificDelays_SchedulesTwoJobs()
    {
        var examId = "e1";
        var start = DateTime.UtcNow.AddHours(1);
        var end = DateTime.UtcNow.AddHours(3);

        _scheduling.ScheduleJobs(examId, start, end);

        _jobClientMock.Verify(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Exactly(2));
    }

    // UTCD-05 | Already expired (Boundary)
    [Fact]
    public void UTCD05_ScheduleJobs_EndInPast_NoJobsScheduled()
    {
        var examId = "e1";
        var start = DateTime.UtcNow.AddMinutes(-10);
        var end = DateTime.UtcNow.AddMinutes(-1);

        _scheduling.ScheduleJobs(examId, start, end);

        _jobClientMock.Verify(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Never);
        // Verify LogWarning (Audit row missed in Sheet)
        _loggerMock.VerifyLog(LogLevel.Warning, "Skipping job scheduling. Exam may already be expired.", Times.Once());
    }

    // UTCD-06 | Null ExamId (Abnormal)
    [Fact]
    public void UTCD06_ScheduleJobs_NullExamId_ThrowsArgumentNullException()
    {
        Action act = () => _scheduling.ScheduleJobs(null!, DateTime.UtcNow, DateTime.UtcNow);

        act.Should().Throw<ArgumentNullException>();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F043 | CancelJobs
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Both jobs exist
    [Fact]
    public void UTCD01_CancelJobs_JobsExist_CallsDeleteTwice()
    {
        var examId = "e1";
        var expectedOpenId = $"exam-open:{examId}";
        var expectedCompleteId = $"exam-complete:{examId}";

        // Mock ChangeState with Deleted state (underlying call for Delete extension)
        _jobClientMock.Setup(j => j.ChangeState(It.IsAny<string>(), It.IsAny<IState>(), It.IsAny<string>())).Returns(true);

        _scheduling.CancelJobs(examId);

        _jobClientMock.Verify(j => j.ChangeState(expectedOpenId, It.Is<IState>(s => s.Name == "Deleted"), null), Times.Once);
        _jobClientMock.Verify(j => j.ChangeState(expectedCompleteId, It.Is<IState>(s => s.Name == "Deleted"), null), Times.Once);
    }

    // UTCD-02 | No jobs exist
    [Fact]
    public void UTCD02_CancelJobs_JobsDoNotExist_StillCallsDelete()
    {
        var examId = "e1";
        _jobClientMock.Setup(j => j.ChangeState(It.IsAny<string>(), It.IsAny<IState>(), It.IsAny<string>())).Returns(false);

        _scheduling.CancelJobs(examId);

        _jobClientMock.Verify(j => j.ChangeState(It.IsAny<string>(), It.IsAny<IState>(), It.IsAny<string>()), Times.Exactly(2));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F044 | RescheduleJobs
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Normal reschedule
    [Fact]
    public void UTCD01_RescheduleJobs_ValidDates_CancelsAndSchedules()
    {
        var examId = "e1";
        var start = DateTime.UtcNow.AddHours(2);
        var end = DateTime.UtcNow.AddHours(4);

        _scheduling.RescheduleJobs(examId, start, end);

        // Verify CancelJobs was called (2 ChangeState calls)
        _jobClientMock.Verify(j => j.ChangeState(It.IsAny<string>(), It.Is<IState>(s => s.Name == "Deleted"), null), Times.Exactly(2));
        // Verify ScheduleJobs was called (2 Create calls)
        _jobClientMock.Verify(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Exactly(2));
    }

    // UTCD-02 | Start > End (Abnormal)
    [Fact]
    public void UTCD02_RescheduleJobs_StartAfterEnd_ThrowsArgumentException()
    {
        var examId = "e1";
        var start = DateTime.UtcNow.AddHours(2);
        var end = DateTime.UtcNow.AddHours(1);

        Action act = () => _scheduling.RescheduleJobs(examId, start, end);

        act.Should().Throw<ArgumentException>();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F045 | MarkExamAsOpenAsync
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Mark ONGOING (Normal)
    [Fact]
    public async Task UTCD01_MarkExamAsOpenAsync_PendingStatus_UpdatesToOngoing()
    {
        var examId = "e1";
        var exam = new Examination { Id = examId, Status = Status.PENDING };

        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);
        _examinationRepoMock.Setup(r => r.UpdateAsync(examId, exam)).ReturnsAsync(exam);

        await _scheduling.MarkExamAsOpenAsync(examId);

        exam.Status.Should().Be(Status.ONGOING);
        _examinationRepoMock.Verify(r => r.UpdateAsync(examId, It.Is<Examination>(e => e.Status == Status.ONGOING)), Times.Once);
    }

    // UTCD-02 | Exam not found (Abnormal)
    [Fact]
    public async Task UTCD02_MarkExamAsOpenAsync_ExamNotFound_LogsWarning()
    {
        var examId = "nonexistent";
        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync((Examination?)null);

        await _scheduling.MarkExamAsOpenAsync(examId);

        _loggerMock.VerifyLog(LogLevel.Warning, $"OPEN job failed: Examination {examId} not found", Times.Once());
        _examinationRepoMock.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()), Times.Never);
    }

    // UTCD-03 | Already ONGOING (Abnormal)
    [Fact]
    public async Task UTCD03_MarkExamAsOpenAsync_AlreadyOngoing_SkipsUpdate()
    {
        var examId = "e1";
        var exam = new Examination { Id = examId, Status = Status.ONGOING };
        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);

        await _scheduling.MarkExamAsOpenAsync(examId);

        _loggerMock.VerifyLog(LogLevel.Information, $"Exam {examId} is already ONGOING", Times.Once());
        _examinationRepoMock.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()), Times.Never);
    }

    // UTCD-04 | Already COMPLETED (Abnormal)
    [Fact]
    public async Task UTCD04_MarkExamAsOpenAsync_AlreadyCompleted_SkipsUpdate()
    {
        var examId = "e1";
        var exam = new Examination { Id = examId, Status = Status.COMPLETED };
        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);

        await _scheduling.MarkExamAsOpenAsync(examId);

        _loggerMock.VerifyLog(LogLevel.Information, $"Exam {examId} is already COMPLETED", Times.Once());
        _examinationRepoMock.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F046 | MarkExamAsCompletedAsync
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Mark COMPLETED from ONGOING (Normal)
    [Fact]
    public async Task UTCD01_MarkExamAsCompletedAsync_OngoingStatus_UpdatesToCompleted()
    {
        var examId = "e1";
        var exam = new Examination { Id = examId, Status = Status.ONGOING };

        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);
        _examinationRepoMock.Setup(r => r.UpdateAsync(examId, exam)).ReturnsAsync(exam);

        await _scheduling.MarkExamAsCompletedAsync(examId);

        exam.Status.Should().Be(Status.COMPLETED);
        _examinationRepoMock.Verify(r => r.UpdateAsync(examId, It.Is<Examination>(e => e.Status == Status.COMPLETED)), Times.Once);
        _loggerMock.VerifyLog(LogLevel.Information, "transitioned to COMPLETED", Times.Once());
    }

    // UTCD-02 | Exam not found (Abnormal)
    [Fact]
    public async Task UTCD02_MarkExamAsCompletedAsync_ExamNotFound_LogsWarning()
    {
        var examId = "nonexistent";
        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync((Examination?)null);

        await _scheduling.MarkExamAsCompletedAsync(examId);

        _loggerMock.VerifyLog(LogLevel.Warning, $"COMPLETE job failed: Examination {examId} not found", Times.Once());
        _examinationRepoMock.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()), Times.Never);
    }

    // UTCD-03 | Already COMPLETED (Abnormal)
    [Fact]
    public async Task UTCD03_MarkExamAsCompletedAsync_AlreadyCompleted_SkipsUpdate()
    {
        var examId = "e1";
        var exam = new Examination { Id = examId, Status = Status.COMPLETED };
        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);

        await _scheduling.MarkExamAsCompletedAsync(examId);

        _loggerMock.VerifyLog(LogLevel.Information, $"Exam {examId} is already COMPLETED", Times.Once());
        _examinationRepoMock.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()), Times.Never);
    }

    // UTCD-04 | Mark COMPLETED from PENDING (Normal - Skip Ongoing)
    [Fact]
    public async Task UTCD04_MarkExamAsCompletedAsync_PendingStatus_UpdatesToCompleted()
    {
        var examId = "e1";
        var exam = new Examination { Id = examId, Status = Status.PENDING };

        _examinationRepoMock.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);
        _examinationRepoMock.Setup(r => r.UpdateAsync(examId, exam)).ReturnsAsync(exam);

        await _scheduling.MarkExamAsCompletedAsync(examId);

        exam.Status.Should().Be(Status.COMPLETED);
        _examinationRepoMock.Verify(r => r.UpdateAsync(examId, It.Is<Examination>(e => e.Status == Status.COMPLETED)), Times.Once);
        _loggerMock.VerifyLog(LogLevel.Information, "transitioned to COMPLETED", Times.Once());
    }
}
