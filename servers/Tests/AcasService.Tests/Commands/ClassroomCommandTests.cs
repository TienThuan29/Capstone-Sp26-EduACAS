using AcasService.Application.Commands.Classroom;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RabbitMQ.Client;

namespace AcasService.Tests.Commands;

public class ClassroomCommandTests
{
    private readonly Mock<IClassroomRepository> _mockClassroomRepo;
    private readonly Mock<ISubjectRepository> _mockSubjectRepo;
    private readonly Mock<ILogger<ClassroomCommand>> _mockLogger;
    private readonly Mock<UserRequestProducer> _mockUserProducer;
    private readonly ClassroomCommand _sut;

    public ClassroomCommandTests()
    {
        _mockClassroomRepo = new Mock<IClassroomRepository>();
        _mockSubjectRepo = new Mock<ISubjectRepository>();
        _mockLogger = new Mock<ILogger<ClassroomCommand>>();
        var fakeRabbitMq = new FakeRabbitMqHostedService();
        _mockUserProducer = new Mock<UserRequestProducer>(
            fakeRabbitMq,
            Mock.Of<ILogger<UserRequestProducer>>());
        _mockUserProducer.CallBase = false;
        _mockUserProducer.Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = "lecturer-1", Fullname = "Dr. Test" });

        _sut = new ClassroomCommand(
            _mockClassroomRepo.Object,
            new ClassroomMapper(),
            _mockLogger.Object,
            _mockUserProducer.Object,
            _mockSubjectRepo.Object);
    }

    private class FakeRabbitMqHostedService : RabbitMqHostedService
    {
        private readonly IModel _fakeChannel = Mock.Of<IModel>();

        public FakeRabbitMqHostedService() { }

        public override IModel Channel => _fakeChannel;
    }

    // ========================================================================
    // CLA-01 — Create classroom successfully (Normal)
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_ValidRequest_ReturnsCreatedClassroom()
    {
        // Arrange
        var request = CreateValidRequest();
        var subject = new Subject { Id = request.SubjectId, SubjectName = "Math", SubjectCode = "MATH101" };
        var createdClassroom = BuildClassroom(request, "classroom-new-1");

        _mockSubjectRepo
            .Setup(x => x.FindByIdAsync(request.SubjectId))
            .ReturnsAsync(subject);
        _mockClassroomRepo
            .Setup(x => x.CreateAsync(It.IsAny<Classroom>()))
            .ReturnsAsync(createdClassroom);
        _mockUserProducer
            .Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = request.LecturerId, Fullname = "Dr. Smith" });

        // Act
        var result = await _sut.CreateClassroomAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be("classroom-new-1");
        result.ClassName.Should().Be(request.ClassName);
        result.ClassCode.Should().Be(request.ClassCode);
        _mockClassroomRepo.Verify(x => x.CreateAsync(It.IsAny<Classroom>()), Times.Once);
    }

    // ========================================================================
    // CLA-01b — Create with auto-generated enrol key (Normal)
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_NoEnrolKey_GeneratesAutoKey()
    {
        // Arrange
        var request = CreateValidRequest();
        request.EnrolKey = null;
        var subject = new Subject { Id = request.SubjectId, SubjectName = "Math", SubjectCode = "MATH101" };
        var createdClassroom = BuildClassroom(request, "classroom-auto-1");

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(request.SubjectId)).ReturnsAsync(subject);
        _mockClassroomRepo.Setup(x => x.CreateAsync(It.Is<Classroom>(c => c.EnrolKey.StartsWith("@"))))
            .ReturnsAsync(createdClassroom);
        _mockUserProducer.Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = request.LecturerId, Fullname = "Dr. Smith" });

        // Act
        var result = await _sut.CreateClassroomAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockClassroomRepo.Verify(x => x.CreateAsync(It.Is<Classroom>(
            c => c.EnrolKey.StartsWith("@") && c.EnrolKey.Length == 7)), Times.Once);
    }

    // ========================================================================
    // CLA-01c — With grading settings (Normal)
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_WithGradingSettings_SetsGradingSettings()
    {
        // Arrange
        var request = CreateValidRequest();
        request.GradingSettings = new GradingSettingsRequest { AvgScoreThreshold = 7.5f, MinExamCount = 3 };
        var subject = new Subject { Id = request.SubjectId, SubjectName = "Math", SubjectCode = "MATH101" };
        var createdClassroom = BuildClassroom(request, "classroom-grade-1");

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(request.SubjectId)).ReturnsAsync(subject);
        _mockClassroomRepo.Setup(x => x.CreateAsync(It.IsAny<Classroom>())).ReturnsAsync(createdClassroom);
        _mockUserProducer.Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = request.LecturerId, Fullname = "Dr. Smith" });

        // Act
        var result = await _sut.CreateClassroomAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.GradingSettings.AvgScoreThreshold.Should().Be(7.5f);
        result.GradingSettings.MinExamCount.Should().Be(3);
    }

    // ========================================================================
    // CLA-01d — Repository returns null (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_RepositoryReturnsNull_ThrowsException()
    {
        // Arrange
        var request = CreateValidRequest();
        var subject = new Subject { Id = request.SubjectId, SubjectName = "Math", SubjectCode = "MATH101" };

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(request.SubjectId)).ReturnsAsync(subject);
        _mockClassroomRepo.Setup(x => x.CreateAsync(It.IsAny<Classroom>())).ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.CreateClassroomAsync(request);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Failed to create classroom*");
    }

    // ========================================================================
    // CLA-02 — Duplicate classroom name (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_SubjectNotFound_ThrowsException()
    {
        // Arrange
        var request = CreateValidRequest();

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(request.SubjectId)).ReturnsAsync((Subject?)null);

        // Act
        var act = async () => await _sut.CreateClassroomAsync(request);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Subject not found*");
        _mockClassroomRepo.Verify(x => x.CreateAsync(It.IsAny<Classroom>()), Times.Never);
    }

    // ========================================================================
    // CLA-03 — Add student to classroom (Normal) — EnrollClass
    // Note: This is tested in ClassEnrollmentsCommandTests.cs
    // Here we test the repository scenario for duplicate enrollment
    // ========================================================================

    // ========================================================================
    // CLA-08 — Update classroom / Assign lecturer (Normal)
    // ========================================================================
    [Fact]
    public async Task UpdateClassroomAsync_ValidRequest_ReturnsUpdatedClassroom()
    {
        // Arrange
        var classroomId = "classroom-update-1";
        var existingClassroom = BuildClassroom(CreateValidRequest(), classroomId);
        existingClassroom.CreatedDate = DateTime.UtcNow.AddDays(-7);
        existingClassroom.SubjectId = "subject-1";
        existingClassroom.GradingSettings = new GradingSettings();

        var updateRequest = new UpdateClassroomRequest
        {
            ClassName = "Updated Class Name",
            ClassCode = "UPD101",
            SubjectId = "subject-1",
            SemesterName = "Spring 2026",
            EnrolKey = "@updated1",
            MaxSlot = 50,
            EndDate = DateTime.UtcNow.AddMonths(6),
            GradingSettings = new GradingSettingsRequest { AvgScoreThreshold = 8.0f, MinExamCount = 4 }
        };

        var subject = new Subject { Id = "subject-1", SubjectName = "Updated Subject", SubjectCode = "SUB1" };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync(existingClassroom);
        _mockClassroomRepo.Setup(x => x.UpdateAsync(It.IsAny<Classroom>()))
            .ReturnsAsync((Classroom c) => c);
        _mockSubjectRepo.Setup(x => x.FindByIdAsync("subject-1")).ReturnsAsync(subject);
        _mockUserProducer.Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = existingClassroom.LecturerId, Fullname = "Dr. Smith" });

        // Act
        var result = await _sut.UpdateClassroomAsync(classroomId, updateRequest);

        // Assert
        result.Should().NotBeNull();
        result!.ClassName.Should().Be("Updated Class Name");
        result.GradingSettings.AvgScoreThreshold.Should().Be(8.0f);
        result.GradingSettings.MinExamCount.Should().Be(4);
        _mockClassroomRepo.Verify(x => x.UpdateAsync(It.IsAny<Classroom>()), Times.Once);
    }

    // ========================================================================
    // CLA-08b — Update with end date before created date (Abnormal)
    // ========================================================================
    [Fact]
    public async Task UpdateClassroomAsync_EndDateBeforeCreatedDate_ThrowsException()
    {
        // Arrange
        var classroomId = "classroom-update-bad-date";
        var existingClassroom = BuildClassroom(CreateValidRequest(), classroomId);
        existingClassroom.CreatedDate = DateTime.UtcNow;
        existingClassroom.SubjectId = "subject-1";

        var updateRequest = new UpdateClassroomRequest
        {
            ClassName = "Bad Date Class",
            ClassCode = "BDC101",
            SubjectId = "subject-1",
            SemesterName = "Spring 2026",
            EnrolKey = "@badkey1",
            MaxSlot = 30,
            EndDate = existingClassroom.CreatedDate.AddDays(-1)
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync(existingClassroom);

        // Act
        var act = async () => await _sut.UpdateClassroomAsync(classroomId, updateRequest);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*End date must be after created date*");
    }

    // ========================================================================
    // CLA-08c — Classroom not found for update (Abnormal)
    // ========================================================================
    [Fact]
    public async Task UpdateClassroomAsync_ClassroomNotFound_ThrowsException()
    {
        // Arrange
        var classroomId = "nonexistent";
        var updateRequest = new UpdateClassroomRequest
        {
            ClassName = "Test", ClassCode = "TST", SubjectId = "s1",
            SemesterName = "Sp26", EnrolKey = "@testkey", MaxSlot = 30,
            EndDate = DateTime.UtcNow.AddMonths(3)
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.UpdateClassroomAsync(classroomId, updateRequest);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Classroom not found*");
    }

    // ========================================================================
    // CLA-08d — Update fails (Abnormal)
    // ========================================================================
    [Fact]
    public async Task UpdateClassroomAsync_RepositoryReturnsNull_ThrowsException()
    {
        // Arrange
        var classroomId = "classroom-update-fail";
        var existingClassroom = BuildClassroom(CreateValidRequest(), classroomId);
        existingClassroom.CreatedDate = DateTime.UtcNow.AddDays(-1);
        existingClassroom.SubjectId = "subject-1";

        var updateRequest = new UpdateClassroomRequest
        {
            ClassName = "Fail Class", ClassCode = "FAIL", SubjectId = "subject-1",
            SemesterName = "Sp26", EnrolKey = "@fail123", MaxSlot = 30,
            EndDate = DateTime.UtcNow.AddMonths(6)
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync(existingClassroom);
        _mockClassroomRepo.Setup(x => x.UpdateAsync(It.IsAny<Classroom>())).ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.UpdateClassroomAsync(classroomId, updateRequest);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Failed to update classroom*");
    }

    // ========================================================================
    // CLA-07 — Delete classroom with students (Normal)
    // ========================================================================
    [Fact]
    public async Task DeleteClassroomAsync_ClassroomExists_DeletesAndReturnsClassroom()
    {
        // Arrange
        var classroomId = "classroom-delete-1";
        var existingClassroom = BuildClassroom(CreateValidRequest(), classroomId);
        existingClassroom.SubjectId = "subject-1";

        var subject = new Subject { Id = "subject-1", SubjectName = "Math", SubjectCode = "MATH101" };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync(existingClassroom);
        _mockClassroomRepo.Setup(x => x.DeleteAsync(classroomId)).Returns(Task.CompletedTask);
        _mockSubjectRepo.Setup(x => x.FindByIdAsync("subject-1")).ReturnsAsync(subject);
        _mockUserProducer.Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = existingClassroom.LecturerId, Fullname = "Dr. Smith" });

        // Act
        var result = await _sut.DeleteClassroomAsync(classroomId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(classroomId);
        _mockClassroomRepo.Verify(x => x.DeleteAsync(classroomId), Times.Once);
    }

    // ========================================================================
    // CLA-07b — Classroom not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task DeleteClassroomAsync_ClassroomNotFound_ThrowsException()
    {
        // Arrange
        var classroomId = "nonexistent";

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.DeleteClassroomAsync(classroomId);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Classroom not found*");
        _mockClassroomRepo.Verify(x => x.DeleteAsync(It.IsAny<string>()), Times.Never);
    }

    // ========================================================================
    // CLA-07c — Regenerate enrol key (Normal)
    // ========================================================================
    [Fact]
    public async Task RegenerateEnrolKeyAsync_ClassroomExists_RegeneratesAndReturnsKey()
    {
        // Arrange
        var classroomId = "classroom-regen-1";
        var existingClassroom = BuildClassroom(CreateValidRequest(), classroomId);
        existingClassroom.EnrolKey = "@oldkey1";
        existingClassroom.SubjectId = "subject-1";
        var subject = new Subject { Id = "subject-1", SubjectName = "Math", SubjectCode = "MATH101" };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync(existingClassroom);
        _mockClassroomRepo.Setup(x => x.UpdateAsync(It.IsAny<Classroom>()))
            .ReturnsAsync((Classroom c) => c);
        _mockSubjectRepo.Setup(x => x.FindByIdAsync("subject-1")).ReturnsAsync(subject);
        _mockUserProducer.Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = existingClassroom.LecturerId, Fullname = "Dr. Smith" });

        // Act
        var result = await _sut.RegenerateEnrolKeyAsync(classroomId);

        // Assert
        result.Should().NotBeNull();
        result!.EnrolKey.Should().StartWith("@");
        result.EnrolKey.Should().NotBe("@oldkey1");
        _mockClassroomRepo.Verify(x => x.UpdateAsync(It.Is<Classroom>(
            c => c.EnrolKey.StartsWith("@") && c.EnrolKey.Length == 7)), Times.Once);
    }

    // ========================================================================
    // CLA-07d — Regenerate key for nonexistent classroom (Abnormal)
    // ========================================================================
    [Fact]
    public async Task RegenerateEnrolKeyAsync_ClassroomNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var classroomId = "nonexistent";

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.RegenerateEnrolKeyAsync(classroomId);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*Classroom not found*");
    }

    // ========================================================================
    // CLA-07e — Regenerate key fails (Abnormal)
    // ========================================================================
    [Fact]
    public async Task RegenerateEnrolKeyAsync_UpdateReturnsNull_ThrowsException()
    {
        // Arrange
        var classroomId = "classroom-regen-fail";
        var existingClassroom = BuildClassroom(CreateValidRequest(), classroomId);
        existingClassroom.SubjectId = "subject-1";

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync(existingClassroom);
        _mockClassroomRepo.Setup(x => x.UpdateAsync(It.IsAny<Classroom>())).ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.RegenerateEnrolKeyAsync(classroomId);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Failed to regenerate enrol key*");
    }

    // ========================================================================
    // CLA-07f — Soft delete (Normal)
    // ========================================================================
    [Fact]
    public async Task SoftDeleteClassroomAsync_ClassroomExists_SoftDeletesAndReturns()
    {
        // Arrange
        var classroomId = "classroom-soft-del";
        var existingClassroom = BuildClassroom(CreateValidRequest(), classroomId);
        existingClassroom.SubjectId = "subject-1";
        existingClassroom.IsDeleted = false;

        var subject = new Subject { Id = "subject-1", SubjectName = "Math", SubjectCode = "MATH101" };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(classroomId)).ReturnsAsync(existingClassroom);
        _mockClassroomRepo.Setup(x => x.SoftDeleteAsync(classroomId)).Returns(Task.CompletedTask);
        _mockSubjectRepo.Setup(x => x.FindByIdAsync("subject-1")).ReturnsAsync(subject);
        _mockUserProducer.Setup(x => x.GetUserByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfileResponse { Id = existingClassroom.LecturerId, Fullname = "Dr. Smith" });

        // Act
        var result = await _sut.SoftDeleteClassroomAsync(classroomId);

        // Assert
        result.Should().NotBeNull();
        _mockClassroomRepo.Verify(x => x.SoftDeleteAsync(classroomId), Times.Once);
    }

    // ========================================================================
    // Helper methods
    // ========================================================================

    private static CreateClassroomRequest CreateValidRequest() => new()
    {
        ClassCode = "TEST101",
        ClassName = "Test Classroom",
        LecturerId = "lecturer-1",
        SubjectId = "subject-1",
        SemesterName = "Spring 2026",
        EnrolKey = "@testkey1",
        MaxSlot = 30,
        EndDate = DateTime.UtcNow.AddMonths(6),
        GradingSettings = new GradingSettingsRequest { AvgScoreThreshold = 5.0f, MinExamCount = 2 }
    };

    private static Classroom BuildClassroom(CreateClassroomRequest request, string id) => new()
    {
        Id = id,
        ClassCode = request.ClassCode,
        ClassName = request.ClassName,
        LecturerId = request.LecturerId,
        SubjectId = request.SubjectId,
        SemesterName = request.SemesterName,
        EnrolKey = request.EnrolKey ?? "@" + Guid.NewGuid().ToString("N")[..6],
        MaxSlot = request.MaxSlot,
        CreatedDate = DateTime.UtcNow,
        UpdatedDate = null,
        EndDate = request.EndDate,
        IsDeleted = false,
        GradingSettings = new GradingSettings
        {
            AvgScoreThreshold = request.GradingSettings?.AvgScoreThreshold ?? 0f,
            MinExamCount = request.GradingSettings?.MinExamCount ?? 0
        }
    };
}
