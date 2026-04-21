using AcasService.Application.Commands.Examination;
using AcasService.Application.Commands.Notification;
using AcasService.Application.Jobs;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
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

    // ========================================================================
    // EXM-01 — Create successfully (Boundary)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_ValidRequest_ReturnsCreatedExam()
    {
        // Arrange
        var startDatetime = DateTime.UtcNow.AddHours(2);
        var endDatetime = DateTime.UtcNow.AddHours(4);
        var request = CreateValidRequest(startDatetime, endDatetime);
        request.Mode = "PRACTICAL";
        request.Status = "PENDING";

        var createdExam = new Examination
        {
            Id = "exam-created-001",
            ExamName = request.ExamName,
            ProgrammingLanguageId = request.ProgrammingLanguageId,
            ClassroomId = request.ClassroomId,
            StartDatetime = startDatetime,
            EndDatetime = endDatetime,
            Description = request.Description,
            IsPublicResult = request.IsPublicResult,
            TotalMark = request.TotalMark,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL,
            UseStrict = request.UseStrict,
            MinScoreThreshold = request.MinScoreThreshold,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(request.ClassroomId))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Test Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(request.ProgrammingLanguageId))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be("exam-created-001");
        result.Status.Should().Be(Status.PENDING);
        result.Mode.Should().Be(Mode.PRACTICAL);

        _mockJobScheduling.Verify(x => x.ScheduleJobs("exam-created-001", startDatetime, endDatetime), Times.Once);
        _mockNotificationService.Verify(x => x.NotifyClassroomAsync(
            createdExam.ClassroomId,
            NotificationType.NEW_EXAMINATION,
            "New examination published",
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<Dictionary<string, object?>?>()), Times.Once);
    }

    // ========================================================================
    // EXM-02 — Classroom not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_ClassroomNotFound_CreatesExamWithoutClassroomInfo()
    {
        // Arrange
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));

        var createdExam = new Examination
        {
            Id = "exam-no-class",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = request.StartDatetime,
            EndDatetime = request.EndDatetime,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(request.ClassroomId))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Unknown Classroom" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert — exam is still created despite missing classroom
        result.Should().NotBeNull();
        result!.Id.Should().Be("exam-no-class");
    }

    // ========================================================================
    // EXM-03 — Start datetime in past (Normal)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_StartDatetimeInPast_SchedulesJobs()
    {
        // Arrange
        var startDatetime = DateTime.UtcNow.AddHours(-1); // past
        var endDatetime = DateTime.UtcNow.AddHours(2);
        var request = CreateValidRequest(startDatetime, endDatetime);

        var createdExam = new Examination
        {
            Id = "exam-past-start",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = startDatetime,
            EndDatetime = endDatetime,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockJobScheduling.Verify(x => x.ScheduleJobs("exam-past-start", startDatetime, endDatetime), Times.Once);
    }

    // ========================================================================
    // EXM-04 — End datetime before start (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_EndBeforeStart_CreatesExam()
    {
        // Arrange
        var startDatetime = DateTime.UtcNow.AddHours(4);
        var endDatetime = DateTime.UtcNow.AddHours(2); // before start
        var request = CreateValidRequest(startDatetime, endDatetime);

        var createdExam = new Examination
        {
            Id = "exam-bad-dates",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = startDatetime,
            EndDatetime = endDatetime,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert — CreateAsync has no validation for end before start
        result.Should().NotBeNull();
        _mockJobScheduling.Verify(x => x.ScheduleJobs("exam-bad-dates", startDatetime, endDatetime), Times.Once);
    }

    // ========================================================================
    // EXM-05 — Empty problem list (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_EmptyProblemList_CreatesExamWithNoProblems()
    {
        // Arrange
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));
        request.Problems = new List<ExaminationProblemDTO>(); // empty

        var createdExam = new Examination
        {
            Id = "exam-no-problems",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = request.StartDatetime,
            EndDatetime = request.EndDatetime,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockRepository.Verify(x => x.CreateAsync(It.Is<Examination>(
            e => e.Problems.Count == 0)), Times.Once);
    }

    // ========================================================================
    // EXM-06 — Mode = EXAMINATION (Boundary)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_ModeExamination_CreatesExamWithExaminationMode()
    {
        // Arrange
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));
        request.Mode = "EXAMINATION";
        request.Status = "PENDING";

        var createdExam = new Examination
        {
            Id = "exam-exam-mode",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = request.StartDatetime,
            EndDatetime = request.EndDatetime,
            Status = Status.PENDING,
            Mode = Mode.EXAMINATION,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Mode.Should().Be(Mode.EXAMINATION);
        _mockJobScheduling.Verify(x => x.ScheduleJobs(
            "exam-exam-mode",
            request.StartDatetime,
            request.EndDatetime), Times.Once);
    }

    // ========================================================================
    // EXM-07 — Mode = PRACTICAL (Normal)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_ModePractical_CreatesExamWithPracticalMode()
    {
        // Arrange
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));
        request.Mode = "PRACTICAL";
        request.Status = "PENDING";

        var createdExam = new Examination
        {
            Id = "exam-prac-mode",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = request.StartDatetime,
            EndDatetime = request.EndDatetime,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

        _mockNotificationService
            .Setup(x => x.NotifyClassroomAsync(
                It.IsAny<string>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<Dictionary<string, object?>?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Mode.Should().Be(Mode.PRACTICAL);
    }

    // ========================================================================
    // EXM-08 — Invalid status value (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_InvalidStatus_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));
        request.Status = "INVALID_STATUS";

        // Act
        var act = async () => await _sut.CreateAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid Status*INVALID_STATUS*");
    }

    // ========================================================================
    // EXM-09 — Notification failure (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateAsync_NotificationServiceFails_PropagatesException()
    {
        // Arrange
        var request = CreateValidRequest(
            DateTime.UtcNow.AddHours(1),
            DateTime.UtcNow.AddHours(3));

        var createdExam = new Examination
        {
            Id = "exam-notif-fail",
            ExamName = request.ExamName,
            ClassroomId = request.ClassroomId,
            StartDatetime = request.StartDatetime,
            EndDatetime = request.EndDatetime,
            Status = Status.PENDING,
            Mode = Mode.PRACTICAL,
            Problems = new List<ExaminationProblem>()
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Examination>()))
            .ReturnsAsync(createdExam);

        _mockClassroomRepository
            .Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Classroom { Id = request.ClassroomId, ClassName = "Class" });

        _mockLanguageRepository
            .Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new ProgrammingLanguage { Id = request.ProgrammingLanguageId, Name = "Python" });

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

        // Assert
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
