using AcasService.Application.Commands.StudentExamSession;
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
    // SES-01: Start exam session
    // ========================================================================
    [Fact]
    public async Task StartAsync_WhenExamExistsAndStudentEnrolled_ReturnsActiveSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var exam = CreateExam(examId, Mode.EXAMINATION, "class-1");
        var enrollment = CreateEnrollment("class-1", studentId);

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo.Setup(x => x.FindByClassAndStudentIdAsync("class-1", studentId))
            .ReturnsAsync(enrollment);
        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync((StudentExamSession?)null);
        _mockSessionRepo.Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync((StudentExamSession s) => s);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("ACTIVE");
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.Is<StudentExamSession>(
            s => s.StudentId == studentId && s.ExamId == examId && s.Phase == StudentExamSessionPhase.Active)),
            Times.Once);
    }

    // ========================================================================
    // SES-02: Start already started session
    // ========================================================================
    [Fact]
    public async Task StartAsync_WhenSessionAlreadyActive_ReturnsExistingSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var exam = CreateExam(examId, Mode.EXAMINATION, "class-1");
        var existingSession = CreateSession(studentId, examId, StudentExamSessionPhase.Active);

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo.Setup(x => x.FindByClassAndStudentIdAsync("class-1", studentId))
            .ReturnsAsync(CreateEnrollment("class-1", studentId));
        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(existingSession);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("ACTIVE");
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.IsAny<StudentExamSession>()), Times.Never);
    }

    // ========================================================================
    // SES-03: Start COMPLETED exam
    // ========================================================================
    [Fact]
    public async Task StartAsync_WhenSessionIsCompleted_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var exam = CreateExam(examId, Mode.EXAMINATION, "class-1");
        var completedSession = CreateSession(studentId, examId, StudentExamSessionPhase.Completed);

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockEnrollmentRepo.Setup(x => x.FindByClassAndStudentIdAsync("class-1", studentId))
            .ReturnsAsync(CreateEnrollment("class-1", studentId));
        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(completedSession);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-04: Start PENDING exam — non-EXAMINATION mode exam
    // ========================================================================
    [Fact]
    public async Task StartAsync_WhenExamNotInExaminationMode_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var exam = CreateExam(examId, Mode.PRACTICAL, "class-1");

        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);

        // Act
        var result = await _sut.StartAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-05: Submit exam
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_WhenSessionIsActive_CompletesSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var activeSession = CreateSession(studentId, examId, StudentExamSessionPhase.Active);

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(activeSession);
        _mockSessionRepo.Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync((StudentExamSession s) => s);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("COMPLETED");
        _mockSessionRepo.Verify(x => x.UpsertAsync(It.Is<StudentExamSession>(
            s => s.Phase == StudentExamSessionPhase.Completed)), Times.Once);
    }

    // ========================================================================
    // SES-06: Submit already submitted
    // ========================================================================
    [Fact]
    public async Task CompleteAsync_WhenSessionIsAlreadyCompleted_ReturnsNull()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var completedSession = CreateSession(studentId, examId, StudentExamSessionPhase.Completed);

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(completedSession);

        // Act
        var result = await _sut.CompleteAsync(studentId, examId);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SES-07: Force submit
    // ========================================================================
    [Fact]
    public async Task LockAsync_WhenSessionIsActive_LocksSession()
    {
        // Arrange
        var studentId = "student-1";
        var examId = "exam-1";
        var activeSession = CreateSession(studentId, examId, StudentExamSessionPhase.Active);
        var lockReason = "Suspicious behavior";

        _mockSessionRepo.Setup(x => x.GetByStudentAndExamAsync(studentId, examId))
            .ReturnsAsync(activeSession);
        _mockSessionRepo.Setup(x => x.UpsertAsync(It.IsAny<StudentExamSession>()))
            .ReturnsAsync((StudentExamSession s) => s);

        // Act
        var result = await _sut.LockAsync(studentId, examId, lockReason);

        // Assert
        result.Should().NotBeNull();
        result!.Phase.Should().Be("LOCKED");
        result.LockReason.Should().Be(lockReason);
    }

    // ========================================================================
    // SES-08: Session not found
    // ========================================================================
    [Fact]
    public async Task SetActiveProblemAsync_WhenSessionNotFound_ReturnsNull()
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
    // Test data helpers
    // ========================================================================

    private static Examination CreateExam(string id, Mode mode, string classroomId) => new()
    {
        Id = id,
        ExamName = "Test Exam",
        ClassroomId = classroomId,
        Mode = mode,
        Status = Status.ONGOING,
        StartDatetime = DateTime.UtcNow.AddMinutes(-30),
        EndDatetime = DateTime.UtcNow.AddHours(2)
    };

    private static ClassEnrollment CreateEnrollment(string classroomId, string studentId) => new()
    {
        Id = $"enroll-{classroomId}-{studentId}",
        ClassId = classroomId,
        StudentId = studentId,
        IsJoining = true
    };

    private static StudentExamSession CreateSession(string studentId, string examId, StudentExamSessionPhase phase) => new()
    {
        Id = $"{studentId}|{examId}",
        StudentId = studentId,
        ExamId = examId,
        ClassroomId = "class-1",
        Phase = phase,
        CreatedDate = DateTime.UtcNow.AddMinutes(-10),
        UpdatedDate = DateTime.UtcNow
    };
}
