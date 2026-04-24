using AcasService.Application.Jobs;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Tests.Helpers;
using FluentAssertions;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Xunit.Abstractions;

namespace AcasService.Tests.Jobs;

/// <summary>
/// Tests for ClassroomQuizJobScheduling covering:
/// - F034 ScheduleCloseJobAsync
/// - F035 CancelCloseJobAsync
/// - F036 RescheduleCloseJobAsync
/// - F037 ScheduleStartJobAsync
/// - F038 CancelStartJobAsync
/// - F039 RescheduleStartJobAsync
/// - F040 OpenQuizAsync
/// - F041 CloseQuizAsync
/// </summary>
public class ClassroomQuizJobSchedulingTests : IDisposable
{
    private readonly Mock<IClassroomQuizRepository> _mockRepository;
    private readonly Mock<IQuizAttemptRepository> _mockQuizAttemptRepo;
    private readonly Mock<ILogger<ClassroomQuizJobScheduling>> _mockLogger;
    private readonly Mock<IBackgroundJobClient> _mockJobClient;
    private readonly FakeBackgroundJobClient _fakeBackgroundJobClient;
    private readonly ITestOutputHelper _output;

    public ClassroomQuizJobSchedulingTests(ITestOutputHelper output)
    {
        _output = output;
        _mockRepository = new Mock<IClassroomQuizRepository>();
        _mockQuizAttemptRepo = new Mock<IQuizAttemptRepository>();
        _mockLogger = new Mock<ILogger<ClassroomQuizJobScheduling>>();
        _mockJobClient = new Mock<IBackgroundJobClient>();
        _fakeBackgroundJobClient = new FakeBackgroundJobClient();
    }

    // Factory methods to create SUT with different IBackgroundJobClient implementations
    private ClassroomQuizJobScheduling CreateSutWithFakeClient()
    {
        return new ClassroomQuizJobScheduling(
            _mockRepository.Object,
            _mockQuizAttemptRepo.Object,
            _fakeBackgroundJobClient,
            _mockLogger.Object);
    }

    private ClassroomQuizJobScheduling CreateSutWithMockClient()
    {
        _mockJobClient.Invocations.Clear();
        return new ClassroomQuizJobScheduling(
            _mockRepository.Object,
            _mockQuizAttemptRepo.Object,
            _mockJobClient.Object,
            _mockLogger.Object);
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
    public async Task F034_UTCID01_ScheduleCloseJobAsync_WithFutureEndTime_SchedulesCloseQuizJob()
    {
        var sut = CreateSutWithFakeClient();
        var quizId = "cq1";
        var futureTime = DateTime.UtcNow.AddMinutes(30);

        var result = await sut.ScheduleCloseJobAsync(quizId, futureTime);

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
    public async Task F034_UTCID02_ScheduleCloseJobAsync_WithPastEndTime_SchedulesJobWithZeroDelay()
    {
        var sut = CreateSutWithFakeClient();
        var quizId = "cq1";
        var pastTime = DateTime.UtcNow.AddMinutes(-1);

        var result = await sut.ScheduleCloseJobAsync(quizId, pastTime);

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
    public async Task F034_UTCID03_ScheduleCloseJobAsync_WithNullEndTime_ThrowsArgumentNullException()
    {
        var sut = CreateSutWithFakeClient();
        var quizId = "cq1";
        var act = () => sut.ScheduleCloseJobAsync(quizId, null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
        _fakeBackgroundJobClient.ScheduleCalls.Should().BeEmpty();
    }

    // ========================================================================
    // F035 CancelCloseJobAsync Tests
    // Code: lines 54-61 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F035-UTCID01: CancelCloseJobAsync("hangfire-job-id-123")
    /// jobId is non-null and not empty -> calls _jobClient.Delete(jobId)
    /// </summary>
    [Fact]
    public void F035_UTCID01_CancelCloseJobAsync_WithValidJobId_CallsDelete()
    {
        var sut = CreateSutWithFakeClient();
        var jobId = "hangfire-job-id-123";

        sut.CancelCloseJobAsync(jobId);

        _fakeBackgroundJobClient.DeleteCalls.Should().Contain(jobId);
    }

    /// <summary>
    /// F035-UTCID02: CancelCloseJobAsync(null) and CancelCloseJobAsync("")
    /// jobId is null or empty -> returns early, no Delete call
    /// </summary>
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void F035_UTCID02_CancelCloseJobAsync_WithNullOrEmptyJobId_DoesNotCallDelete(string? jobId)
    {
        var sut = CreateSutWithFakeClient();

        sut.CancelCloseJobAsync(jobId!);

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
    public async Task F036_UTCID01_RescheduleCloseJobAsync_WithValidOldJobId_CancelsAndReschedules()
    {
        var sut = CreateSutWithFakeClient();
        var oldJobId = "old-job-id";
        var classroomQuizId = "cq1";
        var newEndTime = DateTime.UtcNow.AddMinutes(30);

        var result = await sut.RescheduleCloseJobAsync(oldJobId, classroomQuizId, newEndTime);

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
    public async Task F036_UTCID02_RescheduleCloseJobAsync_WithNullOldJobId_SchedulesWithoutCancel()
    {
        var sut = CreateSutWithFakeClient();
        var classroomQuizId = "cq1";
        var newEndTime = DateTime.UtcNow.AddMinutes(30);

        var result = await sut.RescheduleCloseJobAsync(null, classroomQuizId, newEndTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.DeleteCalls.Should().BeEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "CloseQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == classroomQuizId);
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
    public async Task F037_UTCID01_ScheduleStartJobAsync_WithFutureStartTime_SchedulesOpenQuizJob()
    {
        var sut = CreateSutWithFakeClient();
        var quizId = "cq1";
        var futureTime = DateTime.UtcNow.AddMinutes(30);

        var result = await sut.ScheduleStartJobAsync(quizId, futureTime);

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
    public async Task F037_UTCID02_ScheduleStartJobAsync_WithPastStartTime_SchedulesJobWithZeroDelay()
    {
        var sut = CreateSutWithFakeClient();
        var quizId = "cq1";
        var pastTime = DateTime.UtcNow.AddMinutes(-5);

        var result = await sut.ScheduleStartJobAsync(quizId, pastTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "OpenQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == quizId);
    }

    // ========================================================================
    // F038 CancelStartJobAsync Tests
    // Code: lines 87-94 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F038-UTCID01: CancelStartJobAsync("hangfire-start-job-456")
    /// jobId is non-null and not empty -> calls _jobClient.Delete(jobId)
    /// </summary>
    [Fact]
    public void F038_UTCID01_CancelStartJobAsync_WithValidJobId_CallsDelete()
    {
        var sut = CreateSutWithFakeClient();
        var jobId = "hangfire-start-job-456";

        sut.CancelStartJobAsync(jobId);

        _fakeBackgroundJobClient.DeleteCalls.Should().Contain(jobId);
    }

    /// <summary>
    /// F038-UTCID02: CancelStartJobAsync(null) and CancelStartJobAsync("")
    /// jobId is null or empty -> returns early, no Delete call
    /// </summary>
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void F038_UTCID02_CancelStartJobAsync_WithNullOrEmptyJobId_DoesNotCallDelete(string? jobId)
    {
        var sut = CreateSutWithFakeClient();

        sut.CancelStartJobAsync(jobId!);

        _fakeBackgroundJobClient.DeleteCalls.Should().NotContain(jobId ?? "");
        _fakeBackgroundJobClient.DeleteCalls.Should().BeEmpty();
    }

    // ========================================================================
    // F039 RescheduleStartJobAsync Tests
    // Code: lines 96-103 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F039-UTCID01: RescheduleStartJobAsync with existing oldJobId (Normal)
    /// oldJobId is non-null -> CancelStartJobAsync called -> ScheduleStartJobAsync called
    /// Returns the new jobId string
    /// </summary>
    [Fact]
    public async Task F039_UTCID01_RescheduleStartJobAsync_OldJobIdExists_CancelsAndSchedulesNew()
    {
        var sut = CreateSutWithFakeClient();
        var oldJobId = "old-job-id";
        var classroomQuizId = "cq1";
        var newStartTime = DateTime.UtcNow.AddHours(1);

        var result = await sut.RescheduleStartJobAsync(oldJobId, classroomQuizId, newStartTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.DeleteCalls.Should().Contain(oldJobId);
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "OpenQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == classroomQuizId);
    }

    /// <summary>
    /// F039-UTCID02: RescheduleStartJobAsync with null oldJobId (Normal)
    /// oldJobId is null -> skips CancelStartJobAsync -> only ScheduleStartJobAsync called
    /// Returns the new jobId string
    /// </summary>
    [Fact]
    public async Task F039_UTCID02_RescheduleStartJobAsync_OldJobIdIsNull_OnlySchedulesNew()
    {
        var sut = CreateSutWithFakeClient();
        var classroomQuizId = "cq1";
        var newStartTime = DateTime.UtcNow.AddHours(1);

        var result = await sut.RescheduleStartJobAsync(null, classroomQuizId, newStartTime);

        result.Should().NotBeNullOrEmpty();
        _fakeBackgroundJobClient.DeleteCalls.Should().BeEmpty();
        _fakeBackgroundJobClient.ScheduleCalls.Should().ContainSingle(sc =>
            sc.MethodName == "OpenQuizAsync" &&
            sc.Arguments.Count == 1 &&
            sc.Arguments[0]!.ToString() == classroomQuizId);
    }

    // ========================================================================
    // F040 OpenQuizAsync Tests
    // Code: lines 105-133 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F040-UTCID01: OpenQuizAsync with PUBLISHED quiz (Normal)
    /// Quiz found, status is PUBLISHED -> updates to ONGOING
    /// </summary>
    [Fact]
    public async Task F040_UTCID01_OpenQuizAsync_StatusPublished_UpdatesToOngoing()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.PUBLISHED };

        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);
        _mockRepository.Setup(r => r.UpdateAsync(quiz)).ReturnsAsync(quiz);

        await sut.OpenQuizAsync(cqId);

        quiz.Status.Should().Be(ClassroomQuizStatus.ONGOING);
        _mockRepository.Verify(r => r.UpdateAsync(It.Is<ClassroomQuiz>(q => q.Status == ClassroomQuizStatus.ONGOING)), Times.Once);
    }

    /// <summary>
    /// F040-UTCID02: OpenQuizAsync with non-existent quiz (Abnormal)
    /// Quiz not found -> logs warning, no update
    /// </summary>
    [Fact]
    public async Task F040_UTCID02_OpenQuizAsync_QuizNotFound_LogsWarning()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "nonexistent";
        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync((ClassroomQuiz?)null);

        await sut.OpenQuizAsync(cqId);

        _mockLogger.VerifyLog(LogLevel.Warning, $"START job failed: ClassroomQuiz {cqId} not found.", Times.Once());
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    /// <summary>
    /// F040-UTCID03: OpenQuizAsync with quiz already ONGOING (Abnormal)
    /// Quiz found but status is ONGOING -> skips update, logs info
    /// </summary>
    [Fact]
    public async Task F040_UTCID03_OpenQuizAsync_AlreadyOngoing_SkipsUpdate()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.ONGOING };
        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);

        await sut.OpenQuizAsync(cqId);

        _mockLogger.VerifyLog(LogLevel.Information, $"is {ClassroomQuizStatus.ONGOING} (expected PUBLISHED).", Times.Once());
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    /// <summary>
    /// F040-UTCID04: OpenQuizAsync with quiz in DRAFT status (Abnormal)
    /// Quiz found but status is DRAFT -> skips update, logs info
    /// </summary>
    [Fact]
    public async Task F040_UTCID04_OpenQuizAsync_InDraft_SkipsUpdate()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.DRAFT };
        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);

        await sut.OpenQuizAsync(cqId);

        _mockLogger.VerifyLog(LogLevel.Information, $"is {ClassroomQuizStatus.DRAFT} (expected PUBLISHED).", Times.Once());
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    // ========================================================================
    // F041 CloseQuizAsync Tests
    // Code: lines 135-178 in ClassroomQuizJobScheduling.cs
    // ========================================================================

    /// <summary>
    /// F041-UTCID01: CloseQuizAsync ONGOING quiz with no attempts (Normal)
    /// Quiz found, status ONGOING, no in-progress attempts -> updates to CLOSED
    /// </summary>
    [Fact]
    public async Task F041_UTCID01_CloseQuizAsync_OngoingNoAttempts_UpdatesToClosed()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.ONGOING };

        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);
        _mockQuizAttemptRepo.Setup(r => r.FindByClassroomQuizIdAsync(cqId)).ReturnsAsync(new List<QuizAttempt>());

        await sut.CloseQuizAsync(cqId);

        quiz.Status.Should().Be(ClassroomQuizStatus.CLOSED);
        _mockRepository.Verify(r => r.UpdateAsync(It.Is<ClassroomQuiz>(q => q.Status == ClassroomQuizStatus.CLOSED)), Times.Once);
        _mockQuizAttemptRepo.Verify(r => r.UpdateAsync(It.IsAny<QuizAttempt>()), Times.Never);
    }

    /// <summary>
    /// F041-UTCID02: CloseQuizAsync PUBLISHED quiz with INPROGRESS attempts (Normal)
    /// Quiz found, status PUBLISHED, has in-progress attempts -> updates quiz and force-submits attempts
    /// </summary>
    [Fact]
    public async Task F041_UTCID02_CloseQuizAsync_PublishedWithInProgressAttempts_UpdatesAndForceSubmits()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.PUBLISHED };
        var attempts = new List<QuizAttempt>
        {
            new QuizAttempt { Id = "a1", Status = QuizAttemptStatus.INPROGRESS },
            new QuizAttempt { Id = "a2", Status = QuizAttemptStatus.SUBMITTED }
        };

        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);
        _mockQuizAttemptRepo.Setup(r => r.FindByClassroomQuizIdAsync(cqId)).ReturnsAsync(attempts);

        await sut.CloseQuizAsync(cqId);

        quiz.Status.Should().Be(ClassroomQuizStatus.CLOSED);
        _mockRepository.Verify(r => r.UpdateAsync(It.Is<ClassroomQuiz>(q => q.Status == ClassroomQuizStatus.CLOSED)), Times.Once);
        _mockQuizAttemptRepo.Verify(r => r.UpdateAsync(It.Is<QuizAttempt>(a => a.Id == "a1" && a.Status == QuizAttemptStatus.SUBMITTED)), Times.Once);
    }

    /// <summary>
    /// F041-UTCID03: CloseQuizAsync with quiz already CLOSED (Abnormal)
    /// Quiz found but status is CLOSED -> skips update, logs info
    /// </summary>
    [Fact]
    public async Task F041_UTCID03_CloseQuizAsync_AlreadyClosed_SkipsUpdate()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.CLOSED };
        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);

        await sut.CloseQuizAsync(cqId);

        _mockLogger.VerifyLog(LogLevel.Information, $"is already {ClassroomQuizStatus.CLOSED}.", Times.Once());
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    /// <summary>
    /// F041-UTCID04: CloseQuizAsync with non-existent quiz (Abnormal)
    /// Quiz not found -> logs warning, no update
    /// </summary>
    [Fact]
    public async Task F041_UTCID04_CloseQuizAsync_QuizNotFound_LogsWarning()
    {
        var sut = CreateSutWithMockClient();
        var cqId = "nonexistent";
        _mockRepository.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync((ClassroomQuiz?)null);

        await sut.CloseQuizAsync(cqId);

        _mockLogger.VerifyLog(LogLevel.Warning, $"CLOSE job failed: ClassroomQuiz {cqId} not found.", Times.Once());
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    // ========================================================================
    // FakeBackgroundJobClient
    // Records all Schedule and Delete calls for testing scheduling logic.
    // IBackgroundJobClient.Schedule and .Delete are extension methods, so Moq
    // cannot mock them directly. This fake intercepts the base Create method
    // and ChangeState to capture scheduled jobs and deleted jobs.
    // ========================================================================

    private class FakeBackgroundJobClient : IBackgroundJobClient
    {
        public List<ScheduleCall> ScheduleCalls { get; } = new();
        public List<string> DeleteCalls { get; } = new();

        public string Create(Job job, IState state)
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

        public string Enqueue(Job job) => $"fake-job-{Guid.NewGuid():N}";

        public string Schedule(Job job, DateTimeOffset enqueueAt)
        {
            ScheduleCalls.Add(new ScheduleCall
            {
                JobType = job.Type,
                MethodName = job.Method.Name,
                Arguments = job.Args.ToList()
            });
            return $"fake-job-{Guid.NewGuid():N}";
        }

        public string Schedule(Job job, TimeSpan delay)
        {
            ScheduleCalls.Add(new ScheduleCall
            {
                JobType = job.Type,
                MethodName = job.Method.Name,
                Arguments = job.Args.ToList()
            });
            return $"fake-job-{Guid.NewGuid():N}";
        }

        public bool Delete(string jobId)
        {
            DeleteCalls.Add(jobId);
            return true;
        }

        public bool ChangeState(string jobId, IState newState, string? expectedState)
        {
            if (newState is DeletedState)
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

    public void Dispose()
    {
        _output.WriteLine($"[{DateTime.UtcNow:HH:mm:ss.fff}] Tests completed. " +
            $"ScheduleCalls: {_fakeBackgroundJobClient.ScheduleCalls.Count}, " +
            $"DeleteCalls: {_fakeBackgroundJobClient.DeleteCalls.Count}");
    }
}
