using AcasService.Application.Jobs;
using AcasService.Models;
using AcasService.Repositories.Examination;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Jobs;

/// <summary>
/// Tests for ExaminationJobScheduling using a FakeBackgroundJobClient.
///
/// BackgroundJobClient.Schedule and .Delete are extension methods, so Moq cannot
/// mock them directly. We inject a real IBackgroundJobClient implementation
/// (FakeBackgroundJobClient) that records all calls for assertion.
/// </summary>
public class ExaminationJobSchedulingTests
{
    private readonly Mock<IExaminationRepository> _mockRepository;
    private readonly Mock<ILogger<ExaminationJobScheduling>> _mockLogger;
    private readonly FakeBackgroundJobClient _fakeBackgroundJobClient;
    private readonly ExaminationJobScheduling _sut;

    public ExaminationJobSchedulingTests()
    {
        _mockRepository = new Mock<IExaminationRepository>();
        _mockLogger = new Mock<ILogger<ExaminationJobScheduling>>();
        _fakeBackgroundJobClient = new FakeBackgroundJobClient();
        _sut = new ExaminationJobScheduling(
            _mockRepository.Object,
            _fakeBackgroundJobClient,
            _mockLogger.Object);
    }

    // ========================================================================
    // ScheduleJobs
    // ========================================================================

    [Fact]
    public void ScheduleJobs_WithFutureDates_SchedulesTwoJobs()
    {
        // Arrange
        var examId = "exam-123";
        var startDatetime = DateTime.UtcNow.AddHours(2);
        var endDatetime = DateTime.UtcNow.AddHours(4);

        // Act
        _sut.ScheduleJobs(examId, startDatetime, endDatetime);

        // Assert — exactly 2 Schedule calls: OPEN + COMPLETE
        _fakeBackgroundJobClient.ScheduleCalls.Should().HaveCount(2);
    }

    [Fact]
    public void ScheduleJobs_WithPastEndDatetime_SchedulesNoJobs()
    {
        // Arrange
        var examId = "exam-123";
        var startDatetime = DateTime.UtcNow.AddHours(-4);
        var endDatetime = DateTime.UtcNow.AddHours(-1); // past

        // Act
        _sut.ScheduleJobs(examId, startDatetime, endDatetime);

        // Assert
        _fakeBackgroundJobClient.ScheduleCalls.Should().BeEmpty();
    }

    [Fact]
    public void ScheduleJobs_WithPastStartDatetime_SchedulesBothJobs_OpenFiresImmediately()
    {
        // Arrange
        var examId = "exam-123";
        var startDatetime = DateTime.UtcNow.AddHours(-1); // past — OPEN fires immediately
        var endDatetime = DateTime.UtcNow.AddHours(2);    // future — COMPLETE fires later

        // Act
        _sut.ScheduleJobs(examId, startDatetime, endDatetime);

        // Assert — both OPEN (immediate) and COMPLETE (delayed) jobs are scheduled
        _fakeBackgroundJobClient.ScheduleCalls.Should().HaveCount(2);
        _fakeBackgroundJobClient.ScheduleCalls.Should().Contain(
            c => c.MethodName == "MarkExamAsOpenAsync",
            "OPEN job must fire immediately when StartDatetime is already past");
        _fakeBackgroundJobClient.ScheduleCalls.Should().Contain(
            c => c.MethodName == "MarkExamAsCompletedAsync",
            "COMPLETE job must fire at EndDatetime");
    }

    [Fact]
    public void ScheduleJobs_WithStartDatetimeJustBeforeNow_SchedulesBothJobs()
    {
        // Arrange — simulates the race condition: exam created milliseconds before StartDatetime
        var examId = "exam-race";
        var startDatetime = DateTime.UtcNow.AddMilliseconds(50); // just ~50ms in the future
        var endDatetime = DateTime.UtcNow.AddHours(1);

        // Act
        _sut.ScheduleJobs(examId, startDatetime, endDatetime);

        // Assert — OPEN job is scheduled (>= now check now fires for near-future)
        _fakeBackgroundJobClient.ScheduleCalls.Should().HaveCount(2);
    }

    // ========================================================================
    // CancelJobs
    // ========================================================================

    [Fact]
    public void CancelJobs_DeletesBothOpenAndCompleteJobIds()
    {
        // Arrange
        var examId = "exam-123";

        // Act
        _sut.CancelJobs(examId);

        // Assert
        _fakeBackgroundJobClient.DeleteCalls.Should().Contain($"exam-open:{examId}");
        _fakeBackgroundJobClient.DeleteCalls.Should().Contain($"exam-complete:{examId}");
    }

    [Fact]
    public void CancelJobs_DoesNotThrow_WhenJobsDoNotExist()
    {
        // Arrange
        var examId = "exam-nonexistent";

        // Act
        var act = () => _sut.CancelJobs(examId);

        // Assert — does not throw
        act.Should().NotThrow();
    }

    // ========================================================================
    // RescheduleJobs
    // ========================================================================

    [Fact]
    public void RescheduleJobs_CancelsAndReschedulesBothJobs()
    {
        // Arrange
        var examId = "exam-123";
        var newStart = DateTime.UtcNow.AddHours(3);
        var newEnd = DateTime.UtcNow.AddHours(5);

        // Act
        _sut.RescheduleJobs(examId, newStart, newEnd);

        // Assert — 2 deletions (cancel old), 2 schedules (new)
        _fakeBackgroundJobClient.DeleteCalls.Should().HaveCount(2);
        _fakeBackgroundJobClient.ScheduleCalls.Should().HaveCount(2);
    }

    // ========================================================================
    // MarkExamAsOpenAsync — status transitions
    // ========================================================================

    [Fact]
    public async Task MarkExamAsOpenAsync_WhenExamIsPending_TransitionsToOngoing()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = new Examination
        {
            Id = examId,
            ExamName = "Final Exam",
            Status = Status.PENDING
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        // Act
        await _sut.MarkExamAsOpenAsync(examId);

        // Assert
        existingExam.Status.Should().Be(Status.ONGOING,
            "PENDING exam should transition to ONGOING");

        _mockRepository.Verify(
            x => x.UpdateAsync(examId, It.Is<Examination>(e => e.Status == Status.ONGOING)),
            Times.Once);
    }

    [Fact]
    public async Task MarkExamAsOpenAsync_WhenExamIsAlreadyOngoing_DoesNotUpdate()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = new Examination { Id = examId, Status = Status.ONGOING };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        // Act
        await _sut.MarkExamAsOpenAsync(examId);

        // Assert — idempotent, no update
        _mockRepository.Verify(
            x => x.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()),
            Times.Never);
    }

    [Fact]
    public async Task MarkExamAsOpenAsync_WhenExamIsAlreadyCompleted_DoesNotUpdate()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = new Examination { Id = examId, Status = Status.COMPLETED };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        // Act
        await _sut.MarkExamAsOpenAsync(examId);

        // Assert
        _mockRepository.Verify(
            x => x.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()),
            Times.Never);
    }

    [Fact]
    public async Task MarkExamAsOpenAsync_WhenExamNotFound_DoesNotThrow()
    {
        // Arrange
        var examId = "nonexistent";
        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync((Examination?)null);

        // Act
        var act = async () => await _sut.MarkExamAsOpenAsync(examId);

        // Assert
        await act.Should().NotThrowAsync();
        _mockRepository.Verify(
            x => x.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()),
            Times.Never);
    }

    [Fact]
    public async Task MarkExamAsOpenAsync_UpdatesTimestamp()
    {
        // Arrange
        var examId = "exam-123";
        var before = DateTime.UtcNow;
        var existingExam = new Examination { Id = examId, Status = Status.PENDING };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);
        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        // Act
        await _sut.MarkExamAsOpenAsync(examId);
        var after = DateTime.UtcNow;

        // Assert
        existingExam.UpdatedDate.Should().BeOnOrAfter(before)
            .And.BeOnOrBefore(after);
    }

    // ========================================================================
    // MarkExamAsCompletedAsync — status transitions
    // ========================================================================

    [Fact]
    public async Task MarkExamAsCompletedAsync_WhenExamIsOngoing_TransitionsToCompleted()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = new Examination
        {
            Id = examId,
            ExamName = "Final Exam",
            Status = Status.ONGOING
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);
        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        // Act
        await _sut.MarkExamAsCompletedAsync(examId);

        // Assert
        existingExam.Status.Should().Be(Status.COMPLETED,
            "ONGOING exam should transition to COMPLETED");

        _mockRepository.Verify(
            x => x.UpdateAsync(examId, It.Is<Examination>(e => e.Status == Status.COMPLETED)),
            Times.Once);
    }

    [Fact]
    public async Task MarkExamAsCompletedAsync_WhenExamIsAlreadyCompleted_DoesNotUpdate()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = new Examination { Id = examId, Status = Status.COMPLETED };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        // Act
        await _sut.MarkExamAsCompletedAsync(examId);

        // Assert — idempotent, no update
        _mockRepository.Verify(
            x => x.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()),
            Times.Never);
    }

    [Fact]
    public async Task MarkExamAsCompletedAsync_WhenExamIsPending_StillTransitionsToCompleted()
    {
        // Edge case: if exam was never opened (StartDatetime was in the past at creation),
        // the COMPLETE job still fires and completes it
        var examId = "exam-123";
        var existingExam = new Examination { Id = examId, Status = Status.PENDING };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);
        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        // Act
        await _sut.MarkExamAsCompletedAsync(examId);

        // Assert
        existingExam.Status.Should().Be(Status.COMPLETED);
        _mockRepository.Verify(x => x.UpdateAsync(examId, It.IsAny<Examination>()), Times.Once);
    }

    [Fact]
    public async Task MarkExamAsCompletedAsync_WhenExamNotFound_DoesNotThrow()
    {
        // Arrange
        var examId = "nonexistent";
        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync((Examination?)null);

        // Act
        var act = async () => await _sut.MarkExamAsCompletedAsync(examId);

        // Assert
        await act.Should().NotThrowAsync();
        _mockRepository.Verify(
            x => x.UpdateAsync(It.IsAny<string>(), It.IsAny<Examination>()),
            Times.Never);
    }

    [Fact]
    public async Task MarkExamAsCompletedAsync_WhenRepositoryThrows_PropagatesException()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = new Examination { Id = examId, Status = Status.ONGOING };

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);
        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ThrowsAsync(new Exception("DynamoDB connection failed"));

        // Act
        var act = async () => await _sut.MarkExamAsCompletedAsync(examId);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("DynamoDB connection failed");
    }

    // ========================================================================
    // FakeBackgroundJobClient — in-memory implementation of IBackgroundJobClient
    // Records Schedule/Delete calls without relying on Moq for extension methods.
    // The Schedule extension method delegates to Create, so we intercept both.
    // ========================================================================

    private class FakeBackgroundJobClient : Hangfire.IBackgroundJobClient
    {
        public List<ScheduleCall> ScheduleCalls { get; } = new();
        public List<string> DeleteCalls { get; } = new();

        public string Create(Hangfire.Common.Job job, Hangfire.States.IState state)
        {
            // Intercept calls from Schedule extension methods (which use ScheduledState)
            if (state is Hangfire.States.ScheduledState)
            {
                ScheduleCalls.Add(new ScheduleCall
                {
                    JobType = job.Type,
                    MethodName = job.Method.Name,
                    Arguments = job.Args.ToList()
                });
            }
            return $"fake-job-{Guid.NewGuid():N}";
        }

        public string Enqueue(Hangfire.Common.Job job) => string.Empty;

        public string Schedule(Hangfire.Common.Job job, DateTimeOffset enqueueAt) =>
            $"fake-job-{Guid.NewGuid():N}";

        public string Schedule(Hangfire.Common.Job job, TimeSpan delay)
        {
            // This is called by the Schedule extension — intercepted via Create
            return $"fake-job-{Guid.NewGuid():N}";
        }

        public bool Delete(string jobId)
        {
            DeleteCalls.Add(jobId);
            return true;
        }

        public bool ChangeState(string jobId, Hangfire.States.IState newState,
            string? expectedState)
        {
            // BackgroundJobClientExtensions.Delete calls ChangeState internally,
            // so we capture the job ID when the state is DeletedState
            if (newState is Hangfire.States.DeletedState)
            {
                DeleteCalls.Add(jobId);
            }
            return true;
        }
    }

    private class ScheduleCall
    {
        public Type JobType { get; set; } = null!;
        public string MethodName { get; set; } = string.Empty;
        public List<object?> Arguments { get; set; } = new();
    }
}
