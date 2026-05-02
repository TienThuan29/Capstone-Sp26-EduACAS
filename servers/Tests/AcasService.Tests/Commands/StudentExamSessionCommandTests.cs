using AcasService.Application.Commands.StudentExamSession;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Examination;
using AcasService.Repositories.StudentExamSession;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class StudentExamSessionCommandTests
{
    private readonly Mock<IStudentExamSessionRepository> _mockSessionRepo;
    private readonly Mock<IExaminationRepository> _mockExamRepo;
    private readonly Mock<IClassroomEnrollmentRepository> _mockEnrollmentRepo;
    private readonly Mock<ILogger<StudentExamSessionCommand>> _mockLogger;
    private readonly StudentExamSessionCommand _sut;

    public StudentExamSessionCommandTests()
    {
        _mockSessionRepo = new Mock<IStudentExamSessionRepository>();
        _mockExamRepo = new Mock<IExaminationRepository>();
        _mockEnrollmentRepo = new Mock<IClassroomEnrollmentRepository>();
        _mockLogger = new Mock<ILogger<StudentExamSessionCommand>>();

        _sut = new StudentExamSessionCommand(
            _mockSessionRepo.Object,
            _mockExamRepo.Object,
            _mockEnrollmentRepo.Object,
            _mockLogger.Object);
    }

    // ========================================================================
    // SES-01 — Start exam session (Normal)
    // Function 24: StartAsync(string studentId, string examId)
    // ========================================================================
    [Fact]
    public async Task StartAsync_ValidExamAndEnrolledStudent_ReturnsActiveSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var classroomId = "class-1";

        var exam = new Examination
        {
            Id = examId,
            ClassroomId = classroomId,
            Mode = Mode.EXAMINATION,
            Status = Status.ONGOING
        };

        var enrollment = new ClassEnrollment
        {
            Id = "enroll-1",
            ClassId = classroomId,
            StudentId = studentId,
            IsJoining = true
        };

        var savedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Active,
            CreatedDate = DateTime.UtcNow,
            UpdatedDate = DateTime.UtcNow
        };

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classroomId, studentId))
            .ReturnsAsync(enrollment);
        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync((StudentExamSession?)null);
        _mockSessionRepo
            .Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync(savedSession);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.ExamId.Should().Be(examId);
        result.Phase.Should().Be("ACTIVE");
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.Is<StudentExamSession>(
            s => s.Phase == StudentExamSessionPhase.Active)), Times.Once);
    }

    // ========================================================================
    // SES-01b — GetByExam returns correct session (Normal)
    // ========================================================================
    [Fact]
    public async Task GetByExamAsync_SessionExists_ReturnsSessionResponse()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        var session = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Active,
            UpdatedDate = DateTime.UtcNow
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(session);

        // Act
        var result = await _sut.GetByExamAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.ExamId.Should().Be(examId);
        result.Phase.Should().Be("ACTIVE");
    }

    // ========================================================================
    // SES-01c — GetByExam returns null when no session (Normal)
    // ========================================================================
    [Fact]
    public async Task GetByExamAsync_NoSession_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync((StudentExamSession?)null);

        // Act
        var result = await _sut.GetByExamAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-01d — GetActive returns correct session (Normal)
    // ========================================================================
    [Fact]
    public async Task GetActiveAsync_ActiveSessionExists_ReturnsSession()
    {
        // Arrange
        var studentId = "student-active";
        var session = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, "exam-active"),
            StudentId = studentId,
            ExamId = "exam-active",
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Active,
            UpdatedDate = DateTime.UtcNow
        };

        _mockSessionRepo.Setup(x => x.FindActiveByStudentAsync(studentId))
            .ReturnsAsync(session);

        // Act
        var result = await _sut.GetActiveAsync(studentId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("ACTIVE");
    }

    // ========================================================================
    // SES-01e — Exam not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task StartAsync_ExamNotFound_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "nonexistent";

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync((Examination?)null);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.IsAny<StudentExamSession>()), Times.Never);
    }

    // ========================================================================
    // SES-02 — Start already started session (Normal)
    // Returns existing active session without creating a new one
    // ========================================================================
    [Fact]
    public async Task StartAsync_AlreadyActiveSession_ReturnsExistingSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var classroomId = "class-1";

        var exam = new Examination
        {
            Id = examId,
            ClassroomId = classroomId,
            Mode = Mode.EXAMINATION
        };

        var existingSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Active,
            CreatedDate = DateTime.UtcNow.AddMinutes(-10),
            UpdatedDate = DateTime.UtcNow
        };

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classroomId, studentId))
            .ReturnsAsync(new ClassEnrollment { IsJoining = true });
        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(existingSession);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("ACTIVE");
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.IsAny<StudentExamSession>()), Times.Never);
    }

    // ========================================================================
    // SES-03 — Start COMPLETED exam (Abnormal)
    // ========================================================================
    [Fact]
    public async Task StartAsync_SessionAlreadyCompleted_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var classroomId = "class-1";

        var exam = new Examination
        {
            Id = examId,
            ClassroomId = classroomId,
            Mode = Mode.EXAMINATION
        };

        var completedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Completed,
            CreatedDate = DateTime.UtcNow.AddHours(-2),
            UpdatedDate = DateTime.UtcNow.AddHours(-1)
        };

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classroomId, studentId))
            .ReturnsAsync(new ClassEnrollment { IsJoining = true });
        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(completedSession);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.IsAny<StudentExamSession>()), Times.Never);
    }

    // ========================================================================
    // SES-04 — Start PENDING exam (Abnormal)
    // ========================================================================
    [Fact]
    public async Task StartAsync_SessionAlreadyLocked_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var classroomId = "class-1";

        var exam = new Examination
        {
            Id = examId,
            ClassroomId = classroomId,
            Mode = Mode.EXAMINATION
        };

        var lockedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Locked,
            LockReason = "Academic misconduct",
            CreatedDate = DateTime.UtcNow.AddHours(-1),
            UpdatedDate = DateTime.UtcNow
        };

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classroomId, studentId))
            .ReturnsAsync(new ClassEnrollment { IsJoining = true });
        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(lockedSession);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-08 — Session not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task StartAsync_StudentNotEnrolledInClass_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var classroomId = "class-1";

        var exam = new Examination
        {
            Id = examId,
            ClassroomId = classroomId,
            Mode = Mode.EXAMINATION
        };

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classroomId, studentId))
            .ReturnsAsync((ClassEnrollment?)null);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-08b — Exam is PRACTICAL mode (Abnormal)
    // ========================================================================
    [Fact]
    public async Task StartAsync_ExamIsPracticalMode_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        var exam = new Examination
        {
            Id = examId,
            ClassroomId = "class-1",
            Mode = Mode.PRACTICAL
        };

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-05 — Submit exam (Normal)
    // Function 25: SubmitAsync(string studentId, string examId)
    // Maps to CompleteAsync(studentId, examId)
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_ActiveSession_CompletesSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var classroomId = "class-1";

        var existingSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Active,
            CreatedDate = DateTime.UtcNow.AddMinutes(-30),
            UpdatedDate = DateTime.UtcNow.AddMinutes(-5)
        };

        var completedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Completed,
            LockReason = null,
            CreatedDate = existingSession.CreatedDate,
            UpdatedDate = DateTime.UtcNow
        };

        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(existingSession);
        _mockSessionRepo
            .Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync(completedSession);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("COMPLETED");
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.Is<StudentExamSession>(
            s => s.Phase == StudentExamSessionPhase.Completed)), Times.Once);
    }

    // ========================================================================
    // SES-05b — Submit creates session if not exists (Normal)
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_NoExistingSession_CreatesCompletedSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var classroomId = "class-1";

        var exam = new Examination
        {
            Id = examId,
            ClassroomId = classroomId
        };

        var createdSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Completed,
            CreatedDate = DateTime.UtcNow,
            UpdatedDate = DateTime.UtcNow
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync((StudentExamSession?)null);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classroomId, studentId))
            .ReturnsAsync(new ClassEnrollment { IsJoining = true });
        _mockSessionRepo.Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync(createdSession);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("COMPLETED");
    }

    // ========================================================================
    // SES-06 — Submit already submitted (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_SessionAlreadyCompleted_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        var completedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Completed,
            CreatedDate = DateTime.UtcNow.AddHours(-1),
            UpdatedDate = DateTime.UtcNow.AddMinutes(-30)
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(completedSession);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-06b — Session locked (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_SessionLocked_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        var lockedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Locked,
            LockReason = "Suspected cheating"
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(lockedSession);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-06c — No session and no enrollment (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_NoSessionAndNoEnrollment_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync((StudentExamSession?)null);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync((Examination?)null);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-07 — Force submit (Normal)
    // Function 26: ForceSubmitAsync(string studentId, string examId)
    // This is essentially CompleteAsync - force completing an exam session
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_AsForceSubmit_CompletesSession()
    {
        // Arrange
        var studentId = "student-force";
        var examId = "exam-force";
        var classroomId = "class-1";

        var existingSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Active,
            CreatedDate = DateTime.UtcNow.AddMinutes(-60),
            UpdatedDate = DateTime.UtcNow.AddMinutes(-1)
        };

        var completedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = classroomId,
            Phase = StudentExamSessionPhase.Completed,
            LockReason = null,
            CreatedDate = existingSession.CreatedDate,
            UpdatedDate = DateTime.UtcNow
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(existingSession);
        _mockSessionRepo.Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync(completedSession);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("COMPLETED");
    }

    // ========================================================================
    // SES-07b — Lock session (Normal)
    // ========================================================================
    [Fact]
    public async Task LockAsync_ActiveSession_LocksSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var lockReason = "Academic misconduct detected";

        var existingSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Active,
            UpdatedDate = DateTime.UtcNow
        };

        var lockedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Locked,
            LockReason = lockReason,
            CreatedDate = existingSession.CreatedDate,
            UpdatedDate = DateTime.UtcNow
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(existingSession);
        _mockSessionRepo.Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync(lockedSession);

        // Act
        var result = await _sut.LockAsync(studentId, examId, lockReason);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("LOCKED");
        result.LockReason.Should().Be(lockReason);
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.Is<StudentExamSession>(
            s => s.Phase == StudentExamSessionPhase.Locked)), Times.Once);
    }

    // ========================================================================
    // SES-07c — Lock non-existent session (Abnormal)
    // ========================================================================
    [Fact]
    public async Task LockAsync_NoSession_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync((StudentExamSession?)null);

        // Act
        var result = await _sut.LockAsync(studentId, examId, "Some reason");

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-07d — Lock completed session (Abnormal)
    // ========================================================================
    [Fact]
    public async Task LockAsync_AlreadyCompletedSession_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        var completedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Completed
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(completedSession);

        // Act
        var result = await _sut.LockAsync(studentId, examId, "Late submission");

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-07e — SetActiveProblem (Normal)
    // ========================================================================
    [Fact]
    public async Task SetActiveProblemAsync_ActiveSession_SetsActiveProblem()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var problemId = "problem-5";

        var existingSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Active,
            UpdatedDate = DateTime.UtcNow
        };

        var updatedSession = new StudentExamSession
        {
            Id = StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = "class-1",
            Phase = StudentExamSessionPhase.Active,
            ActiveProblemId = problemId,
            UpdatedDate = DateTime.UtcNow
        };

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(existingSession);
        _mockSessionRepo.Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync(updatedSession);

        // Act
        var result = await _sut.SetActiveProblemAsync(studentId, examId, problemId);

        // Assert
        result.Should().NotBeNull();
        result!.ActiveProblemId.Should().Be(problemId);
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.Is<StudentExamSession>(
            s => s.ActiveProblemId == problemId)), Times.Once);
    }

    // ========================================================================
    // SES-07f — SetActiveProblem no session (Abnormal)
    // ========================================================================
    [Fact]
    public async Task SetActiveProblemAsync_NoSession_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync((StudentExamSession?)null);

        // Act
        var result = await _sut.SetActiveProblemAsync(studentId, examId, "problem-1");

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-07g — HardDelete session (Normal)
    // ========================================================================
    [Fact]
    public async Task HardDeleteAsync_SessionExists_DeletesAndReturnsTrue()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var sessionId = StudentExamSession.ComposeId(studentId, examId);

        _mockSessionRepo.Setup(x => x.DeleteAsync(sessionId))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.HardDeleteAsync(studentId, examId);

        // Assert
        result.Should().BeTrue();
        _mockSessionRepo.Verify(x => x.DeleteAsync(sessionId), Times.Once);
    }

    // ========================================================================
    // SES-07h — HardDelete session not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task HardDeleteAsync_SessionNotFound_ReturnsFalse()
    {
        // Arrange
        var studentId = "nonexistent";
        var examId = "exam-1";
        var sessionId = StudentExamSession.ComposeId(studentId, examId);

        _mockSessionRepo.Setup(x => x.DeleteAsync(sessionId))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.HardDeleteAsync(studentId, examId);

        // Assert
        result.Should().BeFalse();
    }
}
