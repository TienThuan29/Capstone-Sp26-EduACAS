using AcasService.Application.Commands.ClassEnrollments;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ClassEnrollmentsCommandTests
{
    private readonly Mock<IClassroomEnrollmentRepository> _mockEnrollmentRepo;
    private readonly Mock<IClassroomRepository> _mockClassroomRepo;
    private readonly ClassEnrollmentsCommand _sut;

    public ClassEnrollmentsCommandTests()
    {
        _mockEnrollmentRepo = new Mock<IClassroomEnrollmentRepository>();
        _mockClassroomRepo = new Mock<IClassroomRepository>();

        _sut = new ClassEnrollmentsCommand(
            _mockEnrollmentRepo.Object,
            _mockClassroomRepo.Object,
            new ClassEnrollmentMapper());
    }

    // ========================================================================
    // CLA-03 — Add student to classroom (Normal)
    // Function 20: AddStudentAsync(string classroomId, string studentId)
    // Maps to EnrollClass(request) where request contains ClassId, StudentId, EnrolKey
    // ========================================================================
    [Fact]
    public async Task EnrollClass_ValidRequest_ReturnsEnrollmentResponse()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "class-1",
            StudentId = "student-1",
            EnrolKey = "@enroll123"
        };

        var classroom = new Classroom
        {
            Id = request.ClassId,
            ClassCode = "CLA101",
            ClassName = "Test Class",
            EnrolKey = request.EnrolKey,
            IsDeleted = false
        };

        var createdEnrollment = new ClassEnrollment
        {
            Id = "enroll-1",
            ClassId = request.ClassId,
            StudentId = request.StudentId,
            JoinedDate = DateTime.UtcNow,
            IsJoining = true,
            MovedOutDate = null
        };

        _mockClassroomRepo
            .Setup(x => x.FindByIdAsync(request.ClassId))
            .ReturnsAsync(classroom);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId))
            .ReturnsAsync((ClassEnrollment?)null);
        _mockEnrollmentRepo
            .Setup(x => x.CreateAsync(It.IsAny<ClassEnrollment>()))
            .ReturnsAsync(createdEnrollment);

        // Act
        var result = await _sut.EnrollClass(request);

        // Assert
        result.Should().NotBeNull();
        result!.ClassId.Should().Be(request.ClassId);
        result.StudentId.Should().Be(request.StudentId);
        result.IsJoining.Should().BeTrue();
        _mockEnrollmentRepo.Verify(x => x.CreateAsync(It.IsAny<ClassEnrollment>()), Times.Once);
    }

    // ========================================================================
    // CLA-03b — Student already enrolled (Abnormal)
    // Function 20: Add duplicate student
    // ========================================================================
    [Fact]
    public async Task EnrollClass_StudentAlreadyEnrolled_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "class-1",
            StudentId = "student-dup",
            EnrolKey = "@enroll123"
        };

        var classroom = new Classroom
        {
            Id = request.ClassId,
            EnrolKey = request.EnrolKey,
            IsDeleted = false
        };

        var existingEnrollment = new ClassEnrollment
        {
            Id = "existing-enroll",
            ClassId = request.ClassId,
            StudentId = request.StudentId,
            IsJoining = true
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(request.ClassId)).ReturnsAsync(classroom);
        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId))
            .ReturnsAsync(existingEnrollment);

        // Act
        var act = async () => await _sut.EnrollClass(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Student is already enrolled*");
        _mockEnrollmentRepo.Verify(x => x.CreateAsync(It.IsAny<ClassEnrollment>()), Times.Never);
    }

    // ========================================================================
    // CLA-03c — Invalid enrollment key (Abnormal)
    // ========================================================================
    [Fact]
    public async Task EnrollClass_InvalidEnrolKey_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "class-1",
            StudentId = "student-new",
            EnrolKey = "wrong-key"
        };

        var classroom = new Classroom
        {
            Id = request.ClassId,
            EnrolKey = "@correctkey",
            IsDeleted = false
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(request.ClassId)).ReturnsAsync(classroom);

        // Act
        var act = async () => await _sut.EnrollClass(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid enrollment key*");
        _mockEnrollmentRepo.Verify(x => x.CreateAsync(It.IsAny<ClassEnrollment>()), Times.Never);
    }

    // ========================================================================
    // CLA-03d — Class not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task EnrollClass_ClassNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "nonexistent-class",
            StudentId = "student-1",
            EnrolKey = "@enroll123"
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(request.ClassId))
            .ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.EnrollClass(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Class not found*");
    }

    // ========================================================================
    // CLA-03e — Create enrollment fails (Abnormal)
    // ========================================================================
    [Fact]
    public async Task EnrollClass_RepositoryReturnsNull_ThrowsException()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "class-1",
            StudentId = "student-fail",
            EnrolKey = "@enroll123"
        };

        var classroom = new Classroom { Id = request.ClassId, EnrolKey = request.EnrolKey, IsDeleted = false };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(request.ClassId)).ReturnsAsync(classroom);
        _mockEnrollmentRepo.Setup(x => x.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId))
            .ReturnsAsync((ClassEnrollment?)null);
        _mockEnrollmentRepo.Setup(x => x.CreateAsync(It.IsAny<ClassEnrollment>()))
            .ReturnsAsync((ClassEnrollment?)null);

        // Act
        var act = async () => await _sut.EnrollClass(request);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Failed to enroll*");
    }

    // ========================================================================
    // CLA-04 — Add duplicate student (Abnormal)
    // Same as CLA-03b above (already covered)
    // ========================================================================

    // ========================================================================
    // CLA-05 — Remove student (Normal)
    // Function 21: RemoveStudentAsync(string classroomId, string studentId)
    // Maps to LeaveClass(request)
    // ========================================================================
    [Fact]
    public async Task LeaveClass_StudentIsEnrolled_ReturnsUpdatedEnrollment()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "class-1",
            StudentId = "student-1",
            EnrolKey = "@enroll123"
        };

        var enrollment = new ClassEnrollment
        {
            Id = "enroll-1",
            ClassId = request.ClassId,
            StudentId = request.StudentId,
            JoinedDate = DateTime.UtcNow.AddDays(-5),
            IsJoining = true,
            MovedOutDate = null
        };

        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId))
            .ReturnsAsync(enrollment);
        _mockEnrollmentRepo
            .Setup(x => x.UpdateAsync(It.IsAny<ClassEnrollment>()))
            .ReturnsAsync((ClassEnrollment e) => e);

        // Act
        var result = await _sut.LeaveClass(request);

        // Assert
        result.Should().NotBeNull();
        result!.IsJoining.Should().BeFalse();
        result.MovedOutDate.Should().NotBeNull();
        _mockEnrollmentRepo.Verify(x => x.UpdateAsync(It.Is<ClassEnrollment>(
            e => e.IsJoining == false && e.MovedOutDate != null)), Times.Once);
    }

    // ========================================================================
    // CLA-06 — Remove non-existent student (Abnormal)
    // Function 21: Remove non-existent student
    // ========================================================================
    [Fact]
    public async Task LeaveClass_StudentNotEnrolled_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "class-1",
            StudentId = "nonexistent-student",
            EnrolKey = "@enroll123"
        };

        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId))
            .ReturnsAsync((ClassEnrollment?)null);

        // Act
        var act = async () => await _sut.LeaveClass(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Student is not enrolled*");
        _mockEnrollmentRepo.Verify(x => x.UpdateAsync(It.IsAny<ClassEnrollment>()), Times.Never);
    }

    // ========================================================================
    // CLA-06b — Update fails (Abnormal)
    // ========================================================================
    [Fact]
    public async Task LeaveClass_UpdateReturnsNull_ThrowsException()
    {
        // Arrange
        var request = new ClassEnrollmentsRequest
        {
            ClassId = "class-1",
            StudentId = "student-fail",
            EnrolKey = "@enroll123"
        };

        var enrollment = new ClassEnrollment
        {
            Id = "enroll-fail",
            ClassId = request.ClassId,
            StudentId = request.StudentId,
            IsJoining = true
        };

        _mockEnrollmentRepo.Setup(x => x.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId))
            .ReturnsAsync(enrollment);
        _mockEnrollmentRepo.Setup(x => x.UpdateAsync(It.IsAny<ClassEnrollment>()))
            .ReturnsAsync((ClassEnrollment?)null);

        // Act
        var act = async () => await _sut.LeaveClass(request);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Failed to leave class*");
    }

    // ========================================================================
    // CLA-07 — Force remove / Delete classroom with students (Normal)
    // Function 22: DeleteAsync(string classroomId)
    // Note: ForceLeaveClass is the admin-forced version of RemoveStudent
    // ========================================================================
    [Fact]
    public async Task ForceLeaveClass_StudentEnrolled_ReturnsUpdatedEnrollment()
    {
        // Arrange
        var classId = "class-1";
        var studentId = "student-force";

        var enrollment = new ClassEnrollment
        {
            Id = "enroll-force",
            ClassId = classId,
            StudentId = studentId,
            JoinedDate = DateTime.UtcNow.AddDays(-3),
            IsJoining = true,
            MovedOutDate = null
        };

        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classId, studentId))
            .ReturnsAsync(enrollment);
        _mockEnrollmentRepo
            .Setup(x => x.UpdateAsync(It.IsAny<ClassEnrollment>()))
            .ReturnsAsync((ClassEnrollment e) => e);

        // Act
        var result = await _sut.ForceLeaveClass(classId, studentId);

        // Assert
        result.Should().NotBeNull();
        result!.IsJoining.Should().BeFalse();
        result.MovedOutDate.Should().NotBeNull();
        _mockEnrollmentRepo.Verify(x => x.UpdateAsync(It.Is<ClassEnrollment>(
            e => e.IsJoining == false && e.MovedOutDate != null)), Times.Once);
    }

    // ========================================================================
    // CLA-07b — Force remove non-existent student (Abnormal)
    // ========================================================================
    [Fact]
    public async Task ForceLeaveClass_StudentNotEnrolled_ThrowsInvalidOperationException()
    {
        // Arrange
        var classId = "class-1";
        var studentId = "nonexistent";

        _mockEnrollmentRepo
            .Setup(x => x.FindByClassAndStudentIdAsync(classId, studentId))
            .ReturnsAsync((ClassEnrollment?)null);

        // Act
        var act = async () => await _sut.ForceLeaveClass(classId, studentId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Student is not enrolled*");
    }

    // ========================================================================
    // CLA-07c — Force remove update fails (Abnormal)
    // ========================================================================
    [Fact]
    public async Task ForceLeaveClass_UpdateReturnsNull_ThrowsException()
    {
        // Arrange
        var classId = "class-1";
        var studentId = "student-fail";

        var enrollment = new ClassEnrollment
        {
            Id = "enroll-fail-force",
            ClassId = classId,
            StudentId = studentId,
            IsJoining = true
        };

        _mockEnrollmentRepo.Setup(x => x.FindByClassAndStudentIdAsync(classId, studentId))
            .ReturnsAsync(enrollment);
        _mockEnrollmentRepo.Setup(x => x.UpdateAsync(It.IsAny<ClassEnrollment>()))
            .ReturnsAsync((ClassEnrollment?)null);

        // Act
        var act = async () => await _sut.ForceLeaveClass(classId, studentId);

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("*Failed to remove student*");
    }
}
