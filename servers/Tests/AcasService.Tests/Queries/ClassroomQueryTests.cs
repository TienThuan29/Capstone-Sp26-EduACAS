using Moq;
using Xunit;
using FluentAssertions;
using AcasService.Application.Queries.Classroom;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
using AcasService.Web.Requests;
using AcasService.Repositories.ClassroomEnrollment;
using Microsoft.Extensions.Logging;

namespace AcasService.Tests.Queries
{
    public class ClassroomQueryTests
    {
        private readonly Mock<IClassroomRepository> _mockClassroomRepository;
        private readonly Mock<ISubjectRepository> _mockSubjectRepository;
        private readonly Mock<IClassroomEnrollmentRepository> _mockEnrollmentRepository;
        private readonly Mock<ClassroomMapper> _mockClassroomMapper;
        private readonly Mock<UserRequestProducer> _mockUserRequestProducer;
        private readonly Mock<ILogger<ClassroomQuery>> _mockLogger;
        private readonly ClassroomQuery _classroomQuery;

        public ClassroomQueryTests()
        {
            _mockClassroomRepository = new Mock<IClassroomRepository>();
            _mockSubjectRepository = new Mock<ISubjectRepository>();
            _mockEnrollmentRepository = new Mock<IClassroomEnrollmentRepository>();
            _mockClassroomMapper = new Mock<ClassroomMapper>();
            _mockUserRequestProducer = new Mock<UserRequestProducer>();
            _mockLogger = new Mock<ILogger<ClassroomQuery>>();

            _classroomQuery = new ClassroomQuery(
                _mockLogger.Object,
                _mockClassroomRepository.Object,
                _mockSubjectRepository.Object,
                _mockClassroomMapper.Object,
                _mockUserRequestProducer.Object,
                _mockEnrollmentRepository.Object
            );
        }

        #region GetAllClassroomsAsync Tests

        [Fact]
        public async Task GetAllClassroomsAsync_WithValidParameters_ReturnsPagedClassrooms()
        {
            // Arrange
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = "lecturer1", IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow }
            };
            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var userProfiles = new List<UserProfileResponse> { new UserProfileResponse { Id = "lecturer1", Fullname = "John Doe" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockClassroomRepository.Setup(r => r.FindAllAsync()).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockEnrollmentRepository.Setup(r => r.FindByClassIdsAndStudentIdAsync(It.IsAny<List<string>>(), It.IsAny<string>())).ReturnsAsync(new Dictionary<string, ClassEnrollment?>());
            _mockEnrollmentRepository.Setup(r => r.GetStudentCountByClassIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new Dictionary<string, int> { { "class1", 10 } });
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>(), It.IsAny<ClassEnrollment>(), It.IsAny<int>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetAllClassroomsAsync(null, null, null, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.TotalCount.Should().Be(1);
            result.PageIndex.Should().Be(1);
            result.PageSize.Should().Be(10);
            _mockClassroomRepository.Verify(r => r.FindAllAsync(), Times.Once);
        }

        [Fact]
        public async Task GetAllClassroomsAsync_WithSearch_FiltersClassroomsByName()
        {
            // Arrange
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = "lecturer1", IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow },
                new Classroom { Id = "class2", ClassName = "Java101", ClassCode = "JA101", SubjectId = "sub2", LecturerId = "lecturer2", IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow }
            };
            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var userProfiles = new List<UserProfileResponse> { new UserProfileResponse { Id = "lecturer1", Fullname = "John Doe" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockClassroomRepository.Setup(r => r.FindAllAsync()).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockEnrollmentRepository.Setup(r => r.FindByClassIdsAndStudentIdAsync(It.IsAny<List<string>>(), It.IsAny<string>())).ReturnsAsync(new Dictionary<string, ClassEnrollment?>());
            _mockEnrollmentRepository.Setup(r => r.GetStudentCountByClassIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new Dictionary<string, int> { { "class1", 10 } });
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>(), It.IsAny<ClassEnrollment>(), It.IsAny<int>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetAllClassroomsAsync(null, "C#101", null, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.TotalCount.Should().Be(1);
        }

        [Fact]
        public async Task GetAllClassroomsAsync_WithStatusActive_ReturnsActiveClassrooms()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = "lecturer1", IsDeleted = false, EndDate = now.AddDays(1), CreatedDate = now },
                new Classroom { Id = "class2", ClassName = "Java101", ClassCode = "JA101", SubjectId = "sub2", LecturerId = "lecturer2", IsDeleted = false, EndDate = now.AddDays(-1), CreatedDate = now }
            };

            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var userProfiles = new List<UserProfileResponse> { new UserProfileResponse { Id = "lecturer1", Fullname = "John Doe" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockClassroomRepository.Setup(r => r.FindAllAsync()).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockEnrollmentRepository.Setup(r => r.FindByClassIdsAndStudentIdAsync(It.IsAny<List<string>>(), It.IsAny<string>())).ReturnsAsync(new Dictionary<string, ClassEnrollment?>());
            _mockEnrollmentRepository.Setup(r => r.GetStudentCountByClassIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new Dictionary<string, int> { { "class1", 10 } });
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>(), It.IsAny<ClassEnrollment>(), It.IsAny<int>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetAllClassroomsAsync(null, null, "active", 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.TotalCount.Should().Be(1);
        }

        [Fact]
        public async Task GetAllClassroomsAsync_WithPagination_ReturnsCorrectPage()
        {
            // Arrange
            var classrooms = Enumerable.Range(1, 25)
                .Select(i => new Classroom
                {
                    Id = $"class{i}",
                    ClassName = $"Class{i}",
                    ClassCode = $"CC{i}",
                    SubjectId = "sub1",
                    LecturerId = "lecturer1",
                    IsDeleted = false,
                    EndDate = DateTime.UtcNow.AddDays(1),
                    CreatedDate = DateTime.UtcNow.AddDays(-i)
                })
                .ToList();

            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var userProfiles = new List<UserProfileResponse> { new UserProfileResponse { Id = "lecturer1", Fullname = "John Doe" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "Class1" };

            _mockClassroomRepository.Setup(r => r.FindAllAsync()).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockEnrollmentRepository.Setup(r => r.FindByClassIdsAndStudentIdAsync(It.IsAny<List<string>>(), It.IsAny<string>())).ReturnsAsync(new Dictionary<string, ClassEnrollment?>());
            _mockEnrollmentRepository.Setup(r => r.GetStudentCountByClassIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new Dictionary<string, int>());
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>(), It.IsAny<ClassEnrollment>(), It.IsAny<int>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetAllClassroomsAsync(null, null, null, 2, 10);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(25);
            result.PageIndex.Should().Be(2);
            result.PageSize.Should().Be(10);
            result.Items.Should().HaveCount(10);
        }

        [Fact]
        public async Task GetAllClassroomsAsync_WithDeletedClassrooms_ExcludesDeletedByDefault()
        {
            // Arrange
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = "lecturer1", IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow },
                new Classroom { Id = "class2", ClassName = "Java101", ClassCode = "JA101", SubjectId = "sub2", LecturerId = "lecturer2", IsDeleted = true, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow }
            };

            var subjects = new List<Subject>();
            var userProfiles = new List<UserProfileResponse>();
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockClassroomRepository.Setup(r => r.FindAllAsync()).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockEnrollmentRepository.Setup(r => r.FindByClassIdsAndStudentIdAsync(It.IsAny<List<string>>(), It.IsAny<string>())).ReturnsAsync(new Dictionary<string, ClassEnrollment?>());
            _mockEnrollmentRepository.Setup(r => r.GetStudentCountByClassIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new Dictionary<string, int>());
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>(), It.IsAny<ClassEnrollment>(), It.IsAny<int>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetAllClassroomsAsync(null, null, null, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(1);
            result.Items.Should().HaveCount(1);
        }

        #endregion

        #region GetClassroomsByKeywordAsync Tests

        [Fact]
        public async Task GetClassroomsByKeywordAsync_WithValidKeyword_ReturnsMatchingClassrooms()
        {
            // Arrange
            var request = new SearchClassroomRequest { ClassCode = "CS101" };
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = "lecturer1", IsDeleted = false }
            };
            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var userProfiles = new List<UserProfileResponse> { new UserProfileResponse { Id = "lecturer1", Fullname = "John Doe" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockClassroomRepository.Setup(r => r.GetClassroomsByKeywordAsync("CS101")).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetClassroomsByKeywordAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result.First().Id.Should().Be("class1");
        }

        [Fact]
        public async Task GetClassroomsByKeywordAsync_WithNoMatch_ReturnsEmptyList()
        {
            // Arrange
            var request = new SearchClassroomRequest { ClassCode = "NONEXISTENT" };
            _mockClassroomRepository.Setup(r => r.GetClassroomsByKeywordAsync("NONEXISTENT")).ReturnsAsync(new List<Classroom>());

            // Act
            var result = await _classroomQuery.GetClassroomsByKeywordAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        #endregion

        #region FindByStudentIdAsync Tests

        [Fact]
        public async Task FindByStudentIdAsync_WithValidStudentId_ReturnsStudentClassrooms()
        {
            // Arrange
            var studentId = "student1";
            var enrollments = new List<ClassEnrollment>
            {
                new ClassEnrollment { ClassId = "class1", StudentId = studentId, IsJoining = true, JoinedDate = DateTime.UtcNow }
            };
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = "lecturer1", IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow }
            };
            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var userProfiles = new List<UserProfileResponse> { new UserProfileResponse { Id = "lecturer1", Fullname = "John Doe" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockEnrollmentRepository.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(enrollments);
            _mockClassroomRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>(), It.IsAny<ClassEnrollment>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.FindByStudentIdAsync(studentId, null, null, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.TotalCount.Should().Be(1);
        }

        [Fact]
        public async Task FindByStudentIdAsync_WithNoEnrollments_ReturnsEmptyPagedResult()
        {
            // Arrange
            var studentId = "nonexistent";
            _mockEnrollmentRepository.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(new List<ClassEnrollment>());

            // Act
            var result = await _classroomQuery.FindByStudentIdAsync(studentId, null, null, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().BeEmpty();
            result.TotalCount.Should().Be(0);
        }

        [Fact]
        public async Task FindByStudentIdAsync_WithJoiningStatus_FiltersByJoiningClassrooms()
        {
            // Arrange
            var studentId = "student1";
            var enrollments = new List<ClassEnrollment>
            {
                new ClassEnrollment { ClassId = "class1", StudentId = studentId, IsJoining = true, JoinedDate = DateTime.UtcNow },
                new ClassEnrollment { ClassId = "class2", StudentId = studentId, IsJoining = false, JoinedDate = DateTime.UtcNow }
            };
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = "lecturer1", IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow },
                new Classroom { Id = "class2", ClassName = "Java101", ClassCode = "JA101", SubjectId = "sub2", LecturerId = "lecturer2", IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(-1), CreatedDate = DateTime.UtcNow }
            };
            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var userProfiles = new List<UserProfileResponse> { new UserProfileResponse { Id = "lecturer1", Fullname = "John Doe" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockEnrollmentRepository.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(enrollments);
            _mockClassroomRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse>(), It.IsAny<ClassEnrollment>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.FindByStudentIdAsync(studentId, "joining", null, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
        }

        #endregion

        #region GetClassroomsByLecturerIdAsync Tests

        [Fact]
        public async Task GetClassroomsByLecturerIdAsync_WithValidLecturerId_ReturnsLecturerClassrooms()
        {
            // Arrange
            var lecturerId = "lecturer1";
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = lecturerId, IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow }
            };
            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockClassroomRepository.Setup(r => r.GetClassroomsByLecturerIdAsync(lecturerId)).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse?>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetClassroomsByLecturerIdAsync(lecturerId, null, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.TotalCount.Should().Be(1);
        }

        [Fact]
        public async Task GetClassroomsByLecturerIdAsync_WithSearch_FiltersClassroomsByName()
        {
            // Arrange
            var lecturerId = "lecturer1";
            var classrooms = new List<Classroom>
            {
                new Classroom { Id = "class1", ClassName = "C#101", ClassCode = "CS101", SubjectId = "sub1", LecturerId = lecturerId, IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow },
                new Classroom { Id = "class2", ClassName = "Java101", ClassCode = "JA101", SubjectId = "sub2", LecturerId = lecturerId, IsDeleted = false, EndDate = DateTime.UtcNow.AddDays(1), CreatedDate = DateTime.UtcNow }
            };
            var subjects = new List<Subject> { new Subject { Id = "sub1", SubjectName = "C#" } };
            var classroomResponse = new ClassroomResponse { Id = "class1", ClassName = "C#101" };

            _mockClassroomRepository.Setup(r => r.GetClassroomsByLecturerIdAsync(lecturerId)).ReturnsAsync(classrooms);
            _mockSubjectRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(subjects);
            _mockClassroomMapper.Setup(m => m.ToClassroomResponse(It.IsAny<Classroom>(), It.IsAny<Subject>(), It.IsAny<UserProfileResponse?>())).Returns(classroomResponse);

            // Act
            var result = await _classroomQuery.GetClassroomsByLecturerIdAsync(lecturerId, "C#", 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
        }

        #endregion
    }
}
