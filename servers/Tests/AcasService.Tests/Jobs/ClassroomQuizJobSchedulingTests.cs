using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using AcasService.Tests.Helpers;

namespace AcasService.Tests.Jobs;

public class ClassroomQuizJobSchedulingTests
{
    private readonly Mock<IClassroomQuizRepository> _quizRepoMock;
    private readonly Mock<IQuizAttemptRepository> _attemptRepoMock;
    private readonly Mock<IBackgroundJobClient> _jobClientMock;
    private readonly Mock<ILogger<ClassroomQuizJobScheduling>> _loggerMock;
    private readonly ClassroomQuizJobScheduling _scheduling;

    public ClassroomQuizJobSchedulingTests()
    {
        _quizRepoMock = new Mock<IClassroomQuizRepository>();
        _attemptRepoMock = new Mock<IQuizAttemptRepository>();
        _jobClientMock = new Mock<IBackgroundJobClient>();
        _loggerMock = new Mock<ILogger<ClassroomQuizJobScheduling>>();

        _scheduling = new ClassroomQuizJobScheduling(
            _quizRepoMock.Object,
            _attemptRepoMock.Object,
            _jobClientMock.Object,
            _loggerMock.Object
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F039 | RescheduleStartJobAsync
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Reschedule with existing jobId (Normal)
    [Fact]
    public async Task UTCD01_RescheduleStartJobAsync_OldJobIdExists_CancelsAndSchedulesNew()
    {
        // Preconditions from Image:
        // 1. IBackgroundJobClient available (Mocked)
        // 2. oldJobId is non-null
        var oldJobId = "old-job-id";
        var classroomQuizId = "cq1";
        var newStartTime = DateTime.UtcNow.AddHours(1);

        // Setup Mock for Hangfire (Delete old and Create new)
        _jobClientMock.Setup(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>())).Returns("new-job-id");
        _jobClientMock.Setup(j => j.ChangeState(oldJobId, It.IsAny<IState>(), It.IsAny<string>())).Returns(true);

        // Act
        var result = await _scheduling.RescheduleStartJobAsync(oldJobId, classroomQuizId, newStartTime);

        // Confirm from Image:
        // 1. Returns string
        result.Should().Be("new-job-id");
        // 2. old cancelled (ChangeState to Deleted)
        _jobClientMock.Verify(j => j.ChangeState(oldJobId, It.Is<IState>(s => s.Name == "Deleted"), null), Times.Once);
    }

    // UTCD-02 | Reschedule when old job ID is null (Normal)
    [Fact]
    public async Task UTCD02_RescheduleStartJobAsync_OldJobIdIsNull_OnlySchedulesNew()
    {
        // Preconditions for UTCD-02:
        // 1. IBackgroundJobClient available (Mocked)
        // 2. oldJobId is null
        var classroomQuizId = "cq1";
        var newStartTime = DateTime.UtcNow.AddHours(1);
        _jobClientMock.Setup(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>())).Returns("new-job-id");

        // Act
        var result = await _scheduling.RescheduleStartJobAsync(null, classroomQuizId, newStartTime);

        // Confirm:
        // 1. Returns string
        result.Should().Be("new-job-id");
        // 2. DOES NOT call Cancel (ChangeState)
        _jobClientMock.Verify(j => j.ChangeState(It.IsAny<string>(), It.IsAny<IState>(), It.IsAny<string>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F040 | OpenQuizAsync
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Open quiz successfully (Normal)
    [Fact]
    public async Task UTCD01_OpenQuizAsync_StatusPublished_UpdatesToOngoing()
    {
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.PUBLISHED };

        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);
        _quizRepoMock.Setup(r => r.UpdateAsync(quiz)).ReturnsAsync(quiz);

        await _scheduling.OpenQuizAsync(cqId);

        quiz.Status.Should().Be(ClassroomQuizStatus.ONGOING);
        _quizRepoMock.Verify(r => r.UpdateAsync(It.Is<ClassroomQuiz>(q => q.Status == ClassroomQuizStatus.ONGOING)), Times.Once);
    }

    // UTCD-02 | Quiz not found (Abnormal)
    [Fact]
    public async Task UTCD02_OpenQuizAsync_QuizNotFound_LogsWarning()
    {
        var cqId = "nonexistent";
        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync((ClassroomQuiz?)null);

        await _scheduling.OpenQuizAsync(cqId);

        _loggerMock.VerifyLog(LogLevel.Warning, $"START job failed: ClassroomQuiz {cqId} not found.", Times.Once());
        _quizRepoMock.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    // UTCD-03 | Already ONGOING (Abnormal)
    [Fact]
    public async Task UTCD03_OpenQuizAsync_AlreadyOngoing_SkipsUpdate()
    {
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.ONGOING };
        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);

        await _scheduling.OpenQuizAsync(cqId);

        _loggerMock.VerifyLog(LogLevel.Information, $"is {ClassroomQuizStatus.ONGOING} (expected PUBLISHED).", Times.Once());
        _quizRepoMock.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    // UTCD-04 | DRAFT status (Abnormal)
    [Fact]
    public async Task UTCD04_OpenQuizAsync_InDraft_SkipsUpdate()
    {
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.DRAFT };
        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);

        await _scheduling.OpenQuizAsync(cqId);

        _loggerMock.VerifyLog(LogLevel.Information, $"is {ClassroomQuizStatus.DRAFT} (expected PUBLISHED).", Times.Once());
        _quizRepoMock.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F041 | CloseQuizAsync
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Close ONGOING quiz, no attempts (Normal)
    [Fact]
    public async Task UTCD01_CloseQuizAsync_OngoingNoAttempts_UpdatesToClosed()
    {
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.ONGOING };

        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);
        _attemptRepoMock.Setup(r => r.FindByClassroomQuizIdAsync(cqId)).ReturnsAsync(new List<QuizAttempt>());

        await _scheduling.CloseQuizAsync(cqId);

        quiz.Status.Should().Be(ClassroomQuizStatus.CLOSED);
        _quizRepoMock.Verify(r => r.UpdateAsync(It.Is<ClassroomQuiz>(q => q.Status == ClassroomQuizStatus.CLOSED)), Times.Once);
        _attemptRepoMock.Verify(r => r.UpdateAsync(It.IsAny<QuizAttempt>()), Times.Never);
    }

    // UTCD-02 | Close PUBLISHED quiz, with INPROGRESS attempts (Normal)
    [Fact]
    public async Task UTCD02_CloseQuizAsync_PublishedWithAttempts_UpdatesAndForceSubmits()
    {
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.PUBLISHED };
        var attempts = new List<QuizAttempt> 
        { 
            new QuizAttempt { Id = "a1", Status = QuizAttemptStatus.INPROGRESS },
            new QuizAttempt { Id = "a2", Status = QuizAttemptStatus.SUBMITTED }
        };

        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);
        _attemptRepoMock.Setup(r => r.FindByClassroomQuizIdAsync(cqId)).ReturnsAsync(attempts);

        await _scheduling.CloseQuizAsync(cqId);

        quiz.Status.Should().Be(ClassroomQuizStatus.CLOSED);
        _attemptRepoMock.Verify(r => r.UpdateAsync(It.Is<QuizAttempt>(a => a.Status == QuizAttemptStatus.SUBMITTED)), Times.Once);
    }

    // UTCD-03 | Already CLOSED (Abnormal)
    [Fact]
    public async Task UTCD03_CloseQuizAsync_AlreadyClosed_SkipsUpdate()
    {
        var cqId = "cq1";
        var quiz = new ClassroomQuiz { Id = cqId, Status = ClassroomQuizStatus.CLOSED };
        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync(quiz);

        await _scheduling.CloseQuizAsync(cqId);

        _loggerMock.VerifyLog(LogLevel.Information, $"is already {ClassroomQuizStatus.CLOSED}.", Times.Once());
        _quizRepoMock.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }

    // UTCD-04 | Quiz not found (Abnormal)
    [Fact]
    public async Task UTCD04_CloseQuizAsync_QuizNotFound_LogsWarning()
    {
        var cqId = "nonexistent";
        _quizRepoMock.Setup(r => r.FindByIdAsync(cqId)).ReturnsAsync((ClassroomQuiz?)null);

        await _scheduling.CloseQuizAsync(cqId);

        _loggerMock.VerifyLog(LogLevel.Warning, $"CLOSE job failed: ClassroomQuiz {cqId} not found.", Times.Once());
        _quizRepoMock.Verify(r => r.UpdateAsync(It.IsAny<ClassroomQuiz>()), Times.Never);
    }
}
