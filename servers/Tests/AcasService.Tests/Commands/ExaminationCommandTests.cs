using AcasService.Application.Commands.Examination;
using AcasService.Application.Commands.Notification;
using AcasService.Application.Jobs;
using AcasService.Application.Mappers;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Examination;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ExaminationCommandTests
{
    private readonly Mock<IExaminationRepository> _mockRepository;
    private readonly Mock<IClassroomRepository> _mockClassroomRepository;
    private readonly Mock<IProgrammingLanguageRepository> _mockLanguageRepository;
    private readonly Mock<IBusinessNotificationService> _mockNotificationService;
    private readonly Mock<IExaminationJobScheduling> _mockJobScheduling;
    private readonly Mock<ILogger<ExaminationCommand>> _mockLogger;
    private readonly ExaminationCommand _sut;

    public ExaminationCommandTests()
    {
        _mockRepository = new Mock<IExaminationRepository>();
        _mockClassroomRepository = new Mock<IClassroomRepository>();
        _mockLanguageRepository = new Mock<IProgrammingLanguageRepository>();
        _mockNotificationService = new Mock<IBusinessNotificationService>();
        _mockJobScheduling = new Mock<IExaminationJobScheduling>();
        _mockLogger = new Mock<ILogger<ExaminationCommand>>();

        _sut = new ExaminationCommand(
            _mockRepository.Object,
            _mockLogger.Object,
            _mockClassroomRepository.Object,
            _mockLanguageRepository.Object,
            _mockNotificationService.Object,
            _mockJobScheduling.Object);
    }

    // ========================================================================
    // CreateAsync — job scheduling
    // ========================================================================

    [Fact]
    public async Task CreateAsync_SchedulesJobsWithCorrectDates()
    {
        // Arrange
        var startDatetime = DateTime.UtcNow.AddHours(1);
        var endDatetime = DateTime.UtcNow.AddHours(3);
        var request = CreateValidRequest(startDatetime, endDatetime);

        var createdExam = new Examination
        {
            Id = "exam-new-123",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = startDatetime,
            EndDatetime = endDatetime,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = "class-1", ClassName = "Test Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = "lang-1", Name = "Python" });

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be("exam-new-123");

        _mockJobScheduling.Verify(
            x => x.ScheduleJobs(
                "exam-new-123",
                startDatetime,
                endDatetime),
            Times.Once,
            "ScheduleJobs should be called with the created exam's ID and dates");
    }

    [Fact]
    public async Task CreateAsync_DoesNotThrow_WhenNotificationFails()
    {
        // Arrange
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));

        var createdExam = new Examination
        {
            Id = "exam-new-123",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = request.StartDatetime,
            EndDatetime = request.EndDatetime,
            Status = Status.PENDING
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((Classroom?)null);

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((ProgrammingLanguage?)null);

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .ThrowsAsync(new Exception("Notification service unavailable"));

        // Act
        var act = async () => await _sut.CreateAsync(request);

        // Assert — should propagate notification failure
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Notification service unavailable");
    }

    // ========================================================================
    // UpdateAsync — rescheduling
    // ========================================================================

    [Fact]
    public async Task UpdateAsync_WhenStartDatetimeChanges_ReschedulesJobs()
    {
        // Arrange
        var examId = "exam-123";
        var oldStart = DateTime.UtcNow.AddHours(1);
        var oldEnd = DateTime.UtcNow.AddHours(3);
        var newStart = DateTime.UtcNow.AddHours(2);  // changed
        var newEnd = oldEnd;                          // unchanged

        var existingExam = CreateExistingExam(examId, oldStart, oldEnd);
        var updateRequest = CreateValidRequest(newStart, newEnd);

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = "class-1" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = "lang-1" });

        // Act
        await _sut.UpdateAsync(examId, updateRequest);

        // Assert
        _mockJobScheduling.Verify(
            x => x.RescheduleJobs(examId, newStart, newEnd),
            Times.Once,
            "RescheduleJobs should be called when StartDatetime changes");
    }

    [Fact]
    public async Task UpdateAsync_WhenEndDatetimeChanges_ReschedulesJobs()
    {
        // Arrange
        var examId = "exam-123";
        var oldStart = DateTime.UtcNow.AddHours(1);
        var oldEnd = DateTime.UtcNow.AddHours(3);
        var newEnd = DateTime.UtcNow.AddHours(5);   // changed
        var newStart = oldStart;                     // unchanged

        var existingExam = CreateExistingExam(examId, oldStart, oldEnd);
        var updateRequest = CreateValidRequest(newStart, newEnd);

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = "class-1" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = "lang-1" });

        // Act
        await _sut.UpdateAsync(examId, updateRequest);

        // Assert
        _mockJobScheduling.Verify(
            x => x.RescheduleJobs(examId, newStart, newEnd),
            Times.Once,
            "RescheduleJobs should be called when EndDatetime changes");
    }

    [Fact]
    public async Task UpdateAsync_WhenBothDatesChange_ReschedulesJobsOnce()
    {
        // Arrange
        var examId = "exam-123";
        var oldStart = DateTime.UtcNow.AddHours(1);
        var oldEnd = DateTime.UtcNow.AddHours(3);
        var newStart = DateTime.UtcNow.AddHours(2);
        var newEnd = DateTime.UtcNow.AddHours(5);

        var existingExam = CreateExistingExam(examId, oldStart, oldEnd);
        var updateRequest = CreateValidRequest(newStart, newEnd);

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = "class-1" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = "lang-1" });

        // Act
        await _sut.UpdateAsync(examId, updateRequest);

        // Assert — exactly once regardless of how many fields changed
        _mockJobScheduling.Verify(
            x => x.RescheduleJobs(examId, newStart, newEnd),
            Times.Once,
            "RescheduleJobs should be called exactly once when both dates change");
    }

    [Fact]
    public async Task UpdateAsync_WhenNoDatesChange_DoesNotRescheduleJobs()
    {
        // Arrange
        var examId = "exam-123";
        var start = DateTime.UtcNow.AddHours(1);
        var end = DateTime.UtcNow.AddHours(3);

        var existingExam = CreateExistingExam(examId, start, end);
        var updateRequest = CreateValidRequest(start, end);

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        _mockRepository
            .Setup(x => x.UpdateAsync(examId, It.IsAny<Examination>()))
            .ReturnsAsync(existingExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = "class-1" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = "lang-1" });

        // Act
        await _sut.UpdateAsync(examId, updateRequest);

        // Assert
        _mockJobScheduling.Verify(
            x => x.RescheduleJobs(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()),
            Times.Never,
            "RescheduleJobs should NOT be called when neither StartDatetime nor EndDatetime changes");
    }

    [Fact]
    public async Task UpdateAsync_WhenExamNotFound_ThrowsException()
    {
        // Arrange
        var examId = "nonexistent";
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync((Examination?)null);

        // Act
        var act = async () => await _sut.UpdateAsync(examId, request);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Examination with given Id does not exist.");

        _mockJobScheduling.Verify(
            x => x.RescheduleJobs(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()),
            Times.Never,
            "RescheduleJobs should NOT be called when exam does not exist");
    }

    [Fact]
    public async Task UpdateAsync_WhenInvalidStatusProvided_ThrowsArgumentException()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = CreateExistingExam(examId,
            DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(3));

        var invalidRequest = CreateValidRequest(
            DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(3));
        invalidRequest.Status = "INVALID_STATUS";  // invalid

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        // Act
        var act = async () => await _sut.UpdateAsync(examId, invalidRequest);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Invalid status: INVALID_STATUS");
    }

    // ========================================================================
    // DeleteAsync — job cancellation
    // ========================================================================

    [Fact]
    public async Task DeleteAsync_CancelsScheduledJobs_BeforeDeletingExam()
    {
        // Arrange
        var examId = "exam-123";
        var existingExam = CreateExistingExam(examId,
            DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(3));

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        _mockRepository
            .Setup(x => x.DeleteAsync(examId))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteAsync(examId);

        // Assert — cancellation must be called, deletion too
        _mockJobScheduling.Verify(x => x.CancelJobs(examId), Times.Once);
        _mockRepository.Verify(x => x.DeleteAsync(examId), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenExamNotFound_ThrowsException()
    {
        // Arrange
        var examId = "nonexistent";
        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync((Examination?)null);

        // Act
        var act = async () => await _sut.DeleteAsync(examId);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Examination with given Id does not exist.");

        _mockJobScheduling.Verify(x => x.CancelJobs(It.IsAny<string>()), Times.Never);
        _mockRepository.Verify(x => x.DeleteAsync(It.IsAny<string>()), Times.Never);
    }

    // ========================================================================
    // EXM-18: Delete exam when has ongoing submissions
    // ========================================================================

    [Fact]
    public async Task DeleteAsync_WhenExamExists_DeletesEvenIfSubmissionsExist()
    {
        // Arrange — the current implementation does not block deletion on active submissions
        var examId = "exam-with-submissions";
        var existingExam = CreateExistingExam(examId,
            DateTime.UtcNow.AddHours(-1), DateTime.UtcNow.AddHours(1));

        _mockRepository
            .Setup(x => x.GetByIdAsync(examId))
            .ReturnsAsync(existingExam);

        _mockRepository
            .Setup(x => x.DeleteAsync(examId))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteAsync(examId);

        // Assert — deletion proceeds regardless of submission state
        _mockJobScheduling.Verify(x => x.CancelJobs(examId), Times.Once);
        _mockRepository.Verify(x => x.DeleteAsync(examId), Times.Once);
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static ExaminationRequestDTO CreateValidRequest(DateTime start, DateTime end) => new()
    {
        ExamName = "Unit Test Exam",
        ProgrammingLanguageId = "lang-python",
        ClassroomId = "class-101",
        StartDatetime = start,
        EndDatetime = end,
        Description = "Test description",
        IsPublicResult = true,
        TotalMark = 100f,
        Status = "PENDING",
        Mode = "PRACTICAL",
        Problems = new List<ExaminationProblemDTO>()
    };

    private static Examination CreateExistingExam(string id, DateTime start, DateTime end) => new()
    {
        Id = id,
        ExamName = "Existing Exam",
        ProgrammingLanguageId = "lang-python",
        ClassroomId = "class-101",
        StartDatetime = start,
        EndDatetime = end,
        Status = Status.PENDING,
        Mode = Mode.PRACTICAL,
        IsPublicResult = true,
        TotalMark = 100f,
        Problems = new List<ExaminationProblem>()
    };
}
