using AcasService.Application.Commands.Classroom;
using AcasService.Application.Mappers;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ClassroomCommandTests
{
    private readonly Mock<IClassroomRepository> _mockClassroomRepo;
    private readonly Mock<ISubjectRepository> _mockSubjectRepo;
    private readonly TestableUserRequestProducer _userProducer;
    private readonly Mock<ILogger<ClassroomCommand>> _mockLogger;
    private readonly ClassroomMapper _mapper;
    private readonly ClassroomCommand _sut;

    public ClassroomCommandTests()
    {
        _mockClassroomRepo = new Mock<IClassroomRepository>();
        _mockSubjectRepo = new Mock<ISubjectRepository>();
        _mockLogger = new Mock<ILogger<ClassroomCommand>>();
        _mapper = new ClassroomMapper();

        _userProducer = new TestableUserRequestProducer(
            Mock.Of<ILogger<UserRequestProducer>>());

        _sut = new ClassroomCommand(
            _mockClassroomRepo.Object,
            _mapper,
            _mockLogger.Object,
            _userProducer,
            _mockSubjectRepo.Object);
    }

    // ========================================================================
    // CLA-01: Create classroom successfully
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_WithValidRequest_ReturnsCreatedClassroom()
    {
        // Arrange
        var request = CreateValidClassroomRequest();
        var subject = new Subject { Id = request.SubjectId, SubjectName = "Math 101" };
        var createdClassroom = CreateClassroomModel(request, "class-new-123");

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(request.SubjectId))
            .ReturnsAsync(subject);

        _mockClassroomRepo.Setup(x => x.CreateAsync(It.IsAny<Classroom>()))
            .ReturnsAsync(createdClassroom);

        // Act
        var result = await _sut.CreateClassroomAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.ClassName.Should().Be(request.ClassName);
        _mockClassroomRepo.Verify(x => x.CreateAsync(It.IsAny<Classroom>()), Times.Once);
    }

    // ========================================================================
    // CLA-02: Duplicate classroom name
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_WhenRepositoryReturnsNull_ThrowsException()
    {
        // Arrange
        var request = CreateValidClassroomRequest();

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(request.SubjectId))
            .ReturnsAsync(new Subject { Id = request.SubjectId });

        _mockClassroomRepo.Setup(x => x.CreateAsync(It.IsAny<Classroom>()))
            .ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.CreateClassroomAsync(request);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Failed to create classroom");
    }

    // ========================================================================
    // CLA-03: Add student to classroom
    // ========================================================================
    [Fact]
    public async Task CreateClassroomAsync_GeneratesEnrolKey_WhenNotProvided()
    {
        // Arrange
        var request = CreateValidClassroomRequest();
        request.EnrolKey = null;
        var subject = new Subject { Id = request.SubjectId };

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(request.SubjectId))
            .ReturnsAsync(subject);

        _mockClassroomRepo.Setup(x => x.CreateAsync(It.IsAny<Classroom>()))
            .ReturnsAsync((Classroom c) => { c.Id = "class-new"; return c; });

        // Act
        var result = await _sut.CreateClassroomAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockClassroomRepo.Verify(x => x.CreateAsync(
            It.Is<Classroom>(c => !string.IsNullOrEmpty(c.EnrolKey) && c.EnrolKey.StartsWith("@"))),
            Times.Once);
    }

    // ========================================================================
    // CLA-04: Add duplicate student — enrollment duplicate handled elsewhere
    // ========================================================================
    [Fact]
    public async Task UpdateClassroomAsync_WhenClassroomNotFound_ThrowsException()
    {
        // Arrange
        var request = new UpdateClassroomRequest
        {
            ClassCode = "CS101-UPD",
            ClassName = "Updated Class",
            SemesterName = "Spring 2026",
            SubjectId = "subj-1",
            EnrolKey = "@ABC1234",
            MaxSlot = 40,
            EndDate = DateTime.UtcNow.AddMonths(4)
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.UpdateClassroomAsync("nonexistent", request);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Classroom not found");
    }

    // ========================================================================
    // CLA-05: Remove student — via ClassEnrollmentsCommand
    // ========================================================================
    [Fact]
    public async Task SoftDeleteClassroomAsync_WhenClassroomExists_SoftDeletesAndReturns()
    {
        // Arrange
        var classroom = CreateClassroomModel(new CreateClassroomRequest
        {
            ClassCode = "CS101",
            ClassName = "Test Class",
            LecturerId = "lec-1",
            SubjectId = "subj-1",
            SemesterName = "Spring 2026",
            EnrolKey = "@ABC1234",
            MaxSlot = 30,
            EndDate = DateTime.UtcNow.AddMonths(4)
        }, "class-1");

        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1"))
            .ReturnsAsync(classroom);

        _mockClassroomRepo.Setup(x => x.SoftDeleteAsync("class-1"))
            .Returns(Task.CompletedTask);

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(classroom.SubjectId))
            .ReturnsAsync(new Subject { Id = classroom.SubjectId });

        // Act
        var result = await _sut.SoftDeleteClassroomAsync("class-1");

        // Assert
        result.Should().NotBeNull();
        _mockClassroomRepo.Verify(x => x.SoftDeleteAsync("class-1"), Times.Once);
    }

    // ========================================================================
    // CLA-06: Remove non-existent student
    // ========================================================================
    [Fact]
    public async Task SoftDeleteClassroomAsync_WhenClassroomNotFound_ThrowsException()
    {
        // Arrange
        _mockClassroomRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.SoftDeleteClassroomAsync("nonexistent");

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Classroom not found");
    }

    // ========================================================================
    // CLA-07: Delete classroom with students
    // ========================================================================
    [Fact]
    public async Task DeleteClassroomAsync_WhenClassroomExists_DeletesAndReturns()
    {
        // Arrange
        var classroom = CreateClassroomModel(new CreateClassroomRequest
        {
            ClassCode = "CS101",
            ClassName = "Test Class",
            LecturerId = "lec-1",
            SubjectId = "subj-1",
            SemesterName = "Spring 2026",
            EnrolKey = "@ABC1234",
            MaxSlot = 30,
            EndDate = DateTime.UtcNow.AddMonths(4)
        }, "class-1");

        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1"))
            .ReturnsAsync(classroom);

        _mockClassroomRepo.Setup(x => x.DeleteAsync("class-1"))
            .Returns(Task.CompletedTask);

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(classroom.SubjectId))
            .ReturnsAsync(new Subject { Id = classroom.SubjectId });

        // Act
        var result = await _sut.DeleteClassroomAsync("class-1");

        // Assert
        result.Should().NotBeNull();
        _mockClassroomRepo.Verify(x => x.DeleteAsync("class-1"), Times.Once);
    }

    // ========================================================================
    // CLA-08: Assign lecturer
    // ========================================================================
    [Fact]
    public async Task RegenerateEnrolKeyAsync_WhenClassroomExists_RegeneratesKey()
    {
        // Arrange
        var classroom = CreateClassroomModel(new CreateClassroomRequest
        {
            ClassCode = "CS101",
            ClassName = "Test Class",
            LecturerId = "lec-1",
            SubjectId = "subj-1",
            SemesterName = "Spring 2026",
            EnrolKey = "@OLD1234",
            MaxSlot = 30,
            EndDate = DateTime.UtcNow.AddMonths(4)
        }, "class-1");

        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1"))
            .ReturnsAsync(classroom);

        _mockClassroomRepo.Setup(x => x.UpdateAsync(It.IsAny<Classroom>()))
            .ReturnsAsync((Classroom c) => c);

        _mockSubjectRepo.Setup(x => x.FindByIdAsync(classroom.SubjectId))
            .ReturnsAsync(new Subject { Id = classroom.SubjectId });

        // Act
        var result = await _sut.RegenerateEnrolKeyAsync("class-1");

        // Assert
        result.Should().NotBeNull();
        _mockClassroomRepo.Verify(x => x.UpdateAsync(
            It.Is<Classroom>(c => c.EnrolKey != "@OLD1234" && c.EnrolKey.StartsWith("@"))),
            Times.Once);
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static CreateClassroomRequest CreateValidClassroomRequest() => new()
    {
        ClassCode = "CS101",
        ClassName = "Intro to CS",
        LecturerId = "lec-1",
        SubjectId = "subj-1",
        SemesterName = "Spring 2026",
        EnrolKey = "@ABC1234",
        MaxSlot = 30,
        EndDate = DateTime.UtcNow.AddMonths(4)
    };

    private static Classroom CreateClassroomModel(CreateClassroomRequest request, string id) => new()
    {
        Id = id,
        ClassCode = request.ClassCode,
        ClassName = request.ClassName,
        LecturerId = request.LecturerId,
        SubjectId = request.SubjectId,
        SemesterName = request.SemesterName,
        EnrolKey = request.EnrolKey ?? "@" + Guid.NewGuid().ToString("N")[..6],
        MaxSlot = request.MaxSlot,
        EndDate = request.EndDate,
        CreatedDate = DateTime.UtcNow,
        IsDeleted = false,
        GradingSettings = new GradingSettings
        {
            AvgScoreThreshold = request.GradingSettings?.AvgScoreThreshold ?? 0f,
            MinExamCount = request.GradingSettings?.MinExamCount ?? 0
        }
    };
}
