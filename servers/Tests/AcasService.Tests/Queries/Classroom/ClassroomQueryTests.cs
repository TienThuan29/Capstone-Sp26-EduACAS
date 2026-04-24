using AcasService.Application.Queries.Classroom;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
using AcasService.Repositories.ClassroomEnrollment;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcasService.Tests.Queries.Classroom;

public class ClassroomQueryTests
{
    private readonly Mock<IClassroomRepository> _classroomRepoMock;
    private readonly Mock<ISubjectRepository> _subjectRepoMock;
    private readonly Mock<IClassroomEnrollmentRepository> _enrollmentRepoMock;
    private readonly Mock<ILogger<ClassroomQuery>> _loggerMock;
    private readonly Mock<UserRequestProducer> _userProducerMock;
    private readonly ClassroomMapper _mapper;
    private readonly ClassroomQuery _query;

    public ClassroomQueryTests()
    {
        _classroomRepoMock = new Mock<IClassroomRepository>();
        _subjectRepoMock = new Mock<ISubjectRepository>();
        _enrollmentRepoMock = new Mock<IClassroomEnrollmentRepository>();
        _loggerMock = new Mock<ILogger<ClassroomQuery>>();
        _userProducerMock = new Mock<UserRequestProducer>();
        _mapper = new ClassroomMapper();

        _query = new ClassroomQuery(
            _loggerMock.Object,
            _classroomRepoMock.Object,
            _subjectRepoMock.Object,
            _mapper,
            _userProducerMock.Object,
            _enrollmentRepoMock.Object
        );
    }

    // UTCD-01 | Success (Normal)
    [Fact]
    public async Task UTCD01_GetClassroomByIdAsync_Success_ReturnsResponse()
    {
        var id = "c1";
        var classroom = new Models.Classroom { Id = id, SubjectId = "s1", LecturerId = "l1", ClassName = "Class 1" };
        var subject = new Models.Subject { Id = "s1", SubjectName = "Subject 1" };
        var lecturer = new UserProfileResponse { Id = "l1", Fullname = "Lecturer 1" };

        _classroomRepoMock.Setup(r => r.FindByIdAsync(id)).ReturnsAsync(classroom);
        _subjectRepoMock.Setup(r => r.FindByIdAsync("s1")).ReturnsAsync(subject);
        _userProducerMock.Setup(p => p.GetUserByIdAsync("l1", default)).ReturnsAsync(lecturer);

        var result = await _query.GetClassroomByIdAsync(id);

        result.Should().NotBeNull();
        result.Id.Should().Be(id);
        result.Subject.SubjectName.Should().Be("Subject 1");
    }

    // UTCD-02 | Classroom Not Found (Abnormal)
    [Fact]
    public async Task UTCD02_GetClassroomByIdAsync_ClassroomNotFound_ThrowsKeyNotFoundException()
    {
        _classroomRepoMock.Setup(r => r.FindByIdAsync("nonexistent")).ReturnsAsync((Models.Classroom?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _query.GetClassroomByIdAsync("nonexistent"));
        ex.Message.Should().Contain("not found");
    }

    // UTCD-03 | Subject Not Found (Abnormal)
    [Fact]
    public async Task UTCD03_GetClassroomByIdAsync_SubjectNotFound_ThrowsKeyNotFoundException()
    {
        var id = "c1";
        var classroom = new Models.Classroom { Id = id, SubjectId = "s1" };

        _classroomRepoMock.Setup(r => r.FindByIdAsync(id)).ReturnsAsync(classroom);
        _subjectRepoMock.Setup(r => r.FindByIdAsync("s1")).ReturnsAsync((Models.Subject?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _query.GetClassroomByIdAsync(id));
        ex.Message.Should().Contain("Subject with ID s1 not found");
    }
}
