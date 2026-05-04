using Moq;
using Xunit;
using FluentAssertions;
using AcasService.Application.Queries.StudentExamSession;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.StudentExamSession;
using Microsoft.Extensions.Logging;

namespace AcasService.Tests.Queries
{
    public class StudentExamSessionQueryTests
    {
        private readonly Mock<ILogger<StudentExamSessionQuery>> _mockLogger;
        private readonly Mock<IStudentExamSessionRepository> _mockRepository;
        private readonly Mock<UserRequestProducer> _mockUserRequestProducer;
        private readonly StudentExamSessionQuery _studentExamSessionQuery;

        public StudentExamSessionQueryTests()
        {
            _mockLogger = new Mock<ILogger<StudentExamSessionQuery>>();
            _mockRepository = new Mock<IStudentExamSessionRepository>();
            _mockUserRequestProducer = new Mock<UserRequestProducer>();

            _studentExamSessionQuery = new StudentExamSessionQuery(
                _mockLogger.Object,
                _mockRepository.Object,
                _mockUserRequestProducer.Object
            );
        }

        #region GetSessionsByExamIdAsync Tests

        [Fact]
        public async Task GetSessionsByExamIdAsync_WithValidExamId_ReturnsSessions()
        {
            // Arrange
            var examId = "exam1";
            var sessions = new List<StudentExamSession>
            {
                new StudentExamSession
                {
                    Id = "session1",
                    StudentId = "student1",
                    ExamId = examId,
                    ClassroomId = "class1",
                    Phase = StudentExamSessionPhase.Active,
                    ActiveProblemId = "prob1",
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new StudentExamSession
                {
                    Id = "session2",
                    StudentId = "student2",
                    ExamId = examId,
                    ClassroomId = "class1",
                    Phase = StudentExamSessionPhase.Active,
                    ActiveProblemId = "prob2",
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };
            var userProfiles = new List<UserProfileResponse>
            {
                new UserProfileResponse { Id = "student1", Fullname = "John Doe", RoleNumber = "20210001" },
                new UserProfileResponse { Id = "student2", Fullname = "Jane Smith", RoleNumber = "20210002" }
            };

            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(sessions);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);

            // Act
            var result = await _studentExamSessionQuery.GetSessionsByExamIdAsync(examId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result[0].StudentName.Should().Be("John Doe");
            result[1].StudentName.Should().Be("Jane Smith");
            result[0].Phase.Should().Be(StudentExamSessionPhase.Active.ToString());
            _mockRepository.Verify(r => r.GetByExamIdAsync(examId), Times.Once);
        }

        [Fact]
        public async Task GetSessionsByExamIdAsync_WithNoSessions_ReturnsEmptyList()
        {
            // Arrange
            var examId = "nonexistent";
            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(new List<StudentExamSession>());

            // Act
            var result = await _studentExamSessionQuery.GetSessionsByExamIdAsync(examId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
            _mockUserRequestProducer.Verify(p => p.GetUsersByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task GetSessionsByExamIdAsync_MapSessionsToResponses()
        {
            // Arrange
            var examId = "exam1";
            var sessions = new List<StudentExamSession>
            {
                new StudentExamSession
                {
                    Id = "session1",
                    StudentId = "student1",
                    ExamId = examId,
                    ClassroomId = "class1",
                    Phase = StudentExamSessionPhase.Completed,
                    ActiveProblemId = "prob1",
                    LockReason = "Suspicious activity",
                    CreatedDate = DateTime.UtcNow.AddHours(-1),
                    UpdatedDate = DateTime.UtcNow
                }
            };
            var userProfiles = new List<UserProfileResponse>
            {
                new UserProfileResponse { Id = "student1", Fullname = "John Doe", RoleNumber = "20210001" }
            };

            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(sessions);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);

            // Act
            var result = await _studentExamSessionQuery.GetSessionsByExamIdAsync(examId);

            // Assert
            result.Should().HaveCount(1);
            var response = result[0];
            response.Id.Should().Be("session1");
            response.StudentId.Should().Be("student1");
            response.StudentName.Should().Be("John Doe");
            response.StudentRoleNumber.Should().Be("20210001");
            response.ExamId.Should().Be(examId);
            response.ClassroomId.Should().Be("class1");
            response.Phase.Should().Be(StudentExamSessionPhase.Completed.ToString());
            response.ActiveProblemId.Should().Be("prob1");
            response.LockReason.Should().Be("Suspicious activity");
        }

        [Fact]
        public async Task GetSessionsByExamIdAsync_WithMissingUserProfile_FillsWithEmptyString()
        {
            // Arrange
            var examId = "exam1";
            var sessions = new List<StudentExamSession>
            {
                new StudentExamSession
                {
                    Id = "session1",
                    StudentId = "student1",
                    ExamId = examId,
                    ClassroomId = "class1",
                    Phase = StudentExamSessionPhase.Active,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };
            var userProfiles = new List<UserProfileResponse>(); // Empty list

            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(sessions);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);

            // Act
            var result = await _studentExamSessionQuery.GetSessionsByExamIdAsync(examId);

            // Assert
            result.Should().HaveCount(1);
            result[0].StudentName.Should().Be(string.Empty);
            result[0].StudentRoleNumber.Should().Be(string.Empty);
        }

        [Fact]
        public async Task GetSessionsByExamIdAsync_WithMultipleSessions_GetsDistinctStudentIds()
        {
            // Arrange
            var examId = "exam1";
            var sessions = new List<StudentExamSession>
            {
                new StudentExamSession { Id = "session1", StudentId = "student1", ExamId = examId, ClassroomId = "class1", Phase = StudentExamSessionPhase.Active, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow },
                new StudentExamSession { Id = "session2", StudentId = "student2", ExamId = examId, ClassroomId = "class1", Phase = StudentExamSessionPhase.Active, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow },
                new StudentExamSession { Id = "session3", StudentId = "student1", ExamId = examId, ClassroomId = "class1", Phase = StudentExamSessionPhase.Completed, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow }
            };
            var userProfiles = new List<UserProfileResponse>
            {
                new UserProfileResponse { Id = "student1", Fullname = "John Doe", RoleNumber = "20210001" },
                new UserProfileResponse { Id = "student2", Fullname = "Jane Smith", RoleNumber = "20210002" }
            };

            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(sessions);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);

            // Act
            var result = await _studentExamSessionQuery.GetSessionsByExamIdAsync(examId);

            // Assert
            result.Should().HaveCount(3);
            // Verify that GetUsersByIdsAsync was called with exactly 2 distinct student IDs
            _mockUserRequestProducer.Verify(
                p => p.GetUsersByIdsAsync(It.Is<IEnumerable<string>>(l => l.Count() == 2 && l.Contains("student1") && l.Contains("student2")), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task GetSessionsByExamIdAsync_WithDifferentPhases_MapsCorrectly()
        {
            // Arrange
            var examId = "exam1";
            var sessions = new List<StudentExamSession>
            {
                new StudentExamSession { Id = "session1", StudentId = "student1", ExamId = examId, ClassroomId = "class1", Phase = StudentExamSessionPhase.Active, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow },
                new StudentExamSession { Id = "session2", StudentId = "student2", ExamId = examId, ClassroomId = "class1", Phase = StudentExamSessionPhase.Completed, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow },
                new StudentExamSession { Id = "session3", StudentId = "student3", ExamId = examId, ClassroomId = "class1", Phase = StudentExamSessionPhase.Locked, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow }
            };
            var userProfiles = new List<UserProfileResponse>
            {
                new UserProfileResponse { Id = "student1", Fullname = "John", RoleNumber = "001" },
                new UserProfileResponse { Id = "student2", Fullname = "Jane", RoleNumber = "002" },
                new UserProfileResponse { Id = "student3", Fullname = "Bob", RoleNumber = "003" }
            };

            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(sessions);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);

            // Act
            var result = await _studentExamSessionQuery.GetSessionsByExamIdAsync(examId);

            // Assert
            result.Should().HaveCount(3);
            result[0].Phase.Should().Be(StudentExamSessionPhase.Active.ToString());
            result[1].Phase.Should().Be(StudentExamSessionPhase.Completed.ToString());
            result[2].Phase.Should().Be(StudentExamSessionPhase.Locked.ToString());
        }

        [Fact]
        public async Task GetSessionsByExamIdAsync_WhenRepositoryThrows_LogsAndThrows()
        {
            // Arrange
            var examId = "exam1";
            var exception = new Exception("Database error");
            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ThrowsAsync(exception);

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _studentExamSessionQuery.GetSessionsByExamIdAsync(examId));
            _mockLogger.Verify(l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
        }

        [Fact]
        public async Task GetSessionsByExamIdAsync_WithLockReason_IncludesLockReasonInResponse()
        {
            // Arrange
            var examId = "exam1";
            var sessions = new List<StudentExamSession>
            {
                new StudentExamSession
                {
                    Id = "session1",
                    StudentId = "student1",
                    ExamId = examId,
                    ClassroomId = "class1",
                    Phase = StudentExamSessionPhase.Locked,
                    LockReason = "Multiple tab switches detected",
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };
            var userProfiles = new List<UserProfileResponse>
            {
                new UserProfileResponse { Id = "student1", Fullname = "John Doe", RoleNumber = "20210001" }
            };

            _mockRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(sessions);
            _mockUserRequestProducer.Setup(p => p.GetUsersByIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(userProfiles);

            // Act
            var result = await _studentExamSessionQuery.GetSessionsByExamIdAsync(examId);

            // Assert
            result.Should().HaveCount(1);
            result[0].LockReason.Should().Be("Multiple tab switches detected");
        }

        #endregion
    }
}
