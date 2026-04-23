using AcasService.Application.Jobs;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;
using FluentAssertions;
using Hangfire;
using Hangfire.States;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit.Abstractions;

namespace AcasService.Tests.Jobs;

/// <summary>
/// Tests for ClassroomQuizJobScheduling using FakeBackgroundJobClient.
/// IBackgroundJobClient.Schedule and .Delete are extension methods, so Moq cannot
/// mock them directly. We inject a FakeBackgroundJobClient that records all calls.
/// </summary>
public class ClassroomQuizJobSchedulingTests : IDisposable
{
    private readonly Mock<IClassroomQuizRepository> _mockRepository;
    private readonly Mock<IQuizAttemptRepository> _mockQuizAttemptRepo;
    private readonly Mock<ILogger<ClassroomQuizJobScheduling>> _mockLogger;
    private readonly FakeBackgroundJobClient _fakeBackgroundJobClient;
    private readonly ClassroomQuizJobScheduling _sut;
    private readonly ITestOutputHelper _output;

    public ClassroomQuizJobSchedulingTests(ITestOutputHelper output)
    {
        _output = output;
        _mockRepository = new Mock<IClassroomQuizRepository>();
        _mockQuizAttemptRepo = new Mock<IQuizAttemptRepository>();
        _mockLogger = new Mock<ILogger<ClassroomQuizJobScheduling>>();
        _fakeBackgroundJobClient = new FakeBackgroundJobClient();
        _sut = new ClassroomQuizJobScheduling(
            _mockRepository.Object,
            _mockQuizAttemptRepo.Object,
            _fakeBackgroundJobClient,
            _mockLogger.Object);
    }

    public void Dispose()
    {
        _output.WriteLine($"[{DateTime.UtcNow:HH:mm:ss.fff}] Test completed. " +
            $"ScheduleCalls: {_fakeBackgroundJobClient.ScheduleCalls.Count}, " +
            $"DeleteCalls: {_fakeBackgroundJobClient.DeleteCalls.Count}");
    }

    // ========================================================================
    // CancelCloseJobAsync Tests
    // Code: lines 51-58 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F035-UTCID01: CancelCloseJobAsync("hangfire-job-id-123")
    /// jobId is non-null and not empty -> calls _jobClient.Delete(jobId)
    /// </summary>
    [Fact]
    public void CancelCloseJobAsync_WithValidJobId_CallsDelete()
    {
        // Arrange
        var jobId = "hangfire-job-id-123";

        // Act
        _sut.CancelCloseJobAsync(jobId);

        // Assert
        _fakeBackgroundJobClient.DeleteCalls.Should().Contain(jobId);
    }

    /// <summary>
    /// F035-UTCID02: CancelCloseJobAsync(null) and CancelCloseJobAsync("")
    /// jobId is null or empty -> returns early, no Delete call
    /// </summary>
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void CancelCloseJobAsync_WithNullOrEmptyJobId_DoesNotCallDelete(string? jobId)
    {
        // Act
        _sut.CancelCloseJobAsync(jobId!);

        // Assert
        _fakeBackgroundJobClient.DeleteCalls.Should().NotContain(jobId ?? "");
        _fakeBackgroundJobClient.DeleteCalls.Should().BeEmpty();
    }

    // ========================================================================
    // F036 RescheduleCloseJobAsync Tests
    // Code: lines 63-70 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F036-UTCID01: RescheduleCloseJobAsync("old-job-id", "cq1", DateTime.UtcNow.AddMinutes(30))
    /// oldJobId is non-null and non-empty -> calls CancelCloseJobAsync -> calls ScheduleCloseJobAsync
    /// Returns a new non-null, non-empty jobId
    /// </summary>
    [Fact]
    public async Task RescheduleCloseJobAsync_WithValidOldJobId_CancelsAndReschedules()
    {
        var oldJobId = "old-job-id";
        var classroomQuizId = "cq1";
        var newEndTime = DateTime.UtcNow.AddMinutes(30);

        var result = await _sut.RescheduleCloseJobAsync(oldJobId, classroomQuizId, newEndTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.DeleteCalls.Should().Contain(oldJobId);
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "CloseQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == classroomQuizId);
    }

    /// <summary>
    /// F036-UTCID02: RescheduleCloseJobAsync(null, "cq1", DateTime.UtcNow.AddMinutes(30))
    /// oldJobId is null -> skips CancelCloseJobAsync -> calls ScheduleCloseJobAsync
    /// Returns a new non-null, non-empty jobId
    /// </summary>
    [Fact]
    public async Task RescheduleCloseJobAsync_WithNullOldJobId_SchedulesWithoutCancel()
    {
        var classroomQuizId = "cq1";
        var newEndTime = DateTime.UtcNow.AddMinutes(30);

        var result = await _sut.RescheduleCloseJobAsync(null, classroomQuizId, newEndTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.DeleteCalls.Should().BeEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "CloseQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == classroomQuizId);
    }

    // ========================================================================
    // CancelStartJobAsync Tests
    // Code: lines 84-92 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F038-UTCID01: CancelStartJobAsync("hangfire-start-job-456")
    /// jobId is non-null and not empty -> calls _jobClient.Delete(jobId)
    /// </summary>
    [Fact]
    public void CancelStartJobAsync_WithValidJobId_CallsDelete()
    {
        // Arrange
        var jobId = "hangfire-start-job-456";

        // Act
        _sut.CancelStartJobAsync(jobId);

        // Assert
        _fakeBackgroundJobClient.DeleteCalls.Should().Contain(jobId);
    }

    /// <summary>
    /// F038-UTCID02: CancelStartJobAsync(null) and CancelStartJobAsync("")
    /// jobId is null or empty -> returns early, no Delete call
    /// </summary>
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void CancelStartJobAsync_WithNullOrEmptyJobId_DoesNotCallDelete(string? jobId)
    {
        // Act
        _sut.CancelStartJobAsync(jobId!);

        // Assert
        _fakeBackgroundJobClient.DeleteCalls.Should().NotContain(jobId ?? "");
        _fakeBackgroundJobClient.DeleteCalls.Should().BeEmpty();
    }

    // ========================================================================
    // F037 ScheduleStartJobAsync Tests
    // Code: lines 72-85 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F037-UTCID01: ScheduleStartJobAsync("cq1", DateTime.UtcNow.AddMinutes(30))
    /// startTime is in the future -> returns non-null/non-empty string, delay > 0, OpenQuizAsync scheduled
    /// </summary>
    [Fact]
    public async Task ScheduleStartJobAsync_WithFutureStartTime_SchedulesOpenQuizJob()
    {
        var quizId = "cq1";
        var futureTime = DateTime.UtcNow.AddMinutes(30);

        var result = await _sut.ScheduleStartJobAsync(quizId, futureTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "OpenQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == quizId);
    }

    /// <summary>
    /// F037-UTCID02: ScheduleStartJobAsync("cq1", DateTime.UtcNow.AddMinutes(-5))
    /// startTime is in the past -> returns non-null/non-empty string, delay == 0, OpenQuizAsync scheduled immediately
    /// </summary>
    [Fact]
    public async Task ScheduleStartJobAsync_WithPastStartTime_SchedulesJobWithZeroDelay()
    {
        var quizId = "cq1";
        var pastTime = DateTime.UtcNow.AddMinutes(-5);

        var result = await _sut.ScheduleStartJobAsync(quizId, pastTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "OpenQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == quizId);
    }

    // ========================================================================
    // F034 ScheduleCloseJobAsync Tests
    // Code: lines 36-52 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F034-UTCID01: ScheduleCloseJobAsync("cq1", DateTime.UtcNow.AddMinutes(30))
    /// - endTime is NOT null
    /// - endTime is in the future
    /// - Returns a non-null, non-empty jobId
    /// - Verifies the correct method is scheduled with correct argument
    /// </summary>
    [Fact]
    public async Task ScheduleCloseJobAsync_WithFutureEndTime_SchedulesCloseQuizJob()
    {
        var quizId = "cq1";
        var futureTime = DateTime.UtcNow.AddMinutes(30);

        var result = await _sut.ScheduleCloseJobAsync(quizId, futureTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "CloseQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == quizId);
    }

    /// <summary>
    /// F034-UTCID02: ScheduleCloseJobAsync("cq1", DateTime.UtcNow.AddMinutes(-1))
    /// - endTime is NOT null
    /// - endTime is in the past (negative delay)
    /// - Returns a non-null, non-empty jobId
    /// - The job should still be scheduled (delay becomes zero)
    /// </summary>
    [Fact]
    public async Task ScheduleCloseJobAsync_WithPastEndTime_SchedulesJobWithZeroDelay()
    {
        var quizId = "cq1";
        var pastTime = DateTime.UtcNow.AddMinutes(-1);

        var result = await _sut.ScheduleCloseJobAsync(quizId, pastTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "CloseQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == quizId);
    }

    /// <summary>
    /// F034-UTCID03: ScheduleCloseJobAsync("cq1", null)
    /// - endTime is null
    /// - Throws ArgumentNullException
    /// </summary>
    [Fact]
    public async Task ScheduleCloseJobAsync_WithNullEndTime_ThrowsArgumentNullException()
    {
        var quizId = "cq1";
        var act = () => _sut.ScheduleCloseJobAsync(quizId, null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
        _fakeBackgroundJobClient.ScheduleCalls.Should().BeEmpty();
    }

    // ========================================================================
    // ScheduleStartJobAsync Tests
    // ========================================================================

    private class FakeBackgroundJobClient : Hangfire.IBackgroundJobClient
    {
        public List<ScheduleCall> ScheduleCalls { get; } = new();
        public List<string> DeleteCalls { get; } = new();

        public string Create(Hangfire.Common.Job job, Hangfire.States.IState state)
        {
            if (state is ScheduledState)
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

        public string Schedule(Hangfire.Common.Job job, TimeSpan delay) =>
            $"fake-job-{Guid.NewGuid():N}";

        public bool Delete(string jobId)
        {
            DeleteCalls.Add(jobId);
            return true;
        }

        public bool ChangeState(string jobId, Hangfire.States.IState newState,
            string? expectedState)
        {
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
        public string MethodName { get; set; } = null!;
        public List<object?> Arguments { get; set; } = new();
    }
}
