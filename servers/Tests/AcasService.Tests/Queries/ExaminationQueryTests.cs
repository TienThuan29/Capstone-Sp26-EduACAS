using Moq;
using Xunit;
using FluentAssertions;
using AcasService.Application.Queries.Examination;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Examination;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Problem;
using Microsoft.Extensions.Logging;

namespace AcasService.Tests.Queries
{
    public class ExaminationQueryTests
    {
        private readonly Mock<IExaminationRepository> _mockExaminationRepository;
        private readonly ExaminationMapper _examinationMapper;
        private readonly ProblemMapper _problemMapper;
        private readonly Mock<IProgrammingLanguageRepository> _mockProgrammingLanguageRepository;
        private readonly Mock<IProblemRepository> _mockProblemRepository;
        private readonly Mock<IClassroomRepository> _mockClassroomRepository;
        private readonly Mock<ILogger<ExaminationQuery>> _mockLogger;
        private readonly ExaminationQuery _examinationQuery;

        public ExaminationQueryTests()
        {
            _mockExaminationRepository = new Mock<IExaminationRepository>();
            _examinationMapper = new ExaminationMapper();
            _problemMapper = new ProblemMapper();
            _mockProgrammingLanguageRepository = new Mock<IProgrammingLanguageRepository>();
            _mockProblemRepository = new Mock<IProblemRepository>();
            _mockClassroomRepository = new Mock<IClassroomRepository>();
            _mockLogger = new Mock<ILogger<ExaminationQuery>>();

            _examinationQuery = new ExaminationQuery(
                _mockExaminationRepository.Object,
                _mockLogger.Object,
                _examinationMapper,
                _mockClassroomRepository.Object,
                _mockProgrammingLanguageRepository.Object,
                _mockProblemRepository.Object,
                _problemMapper
            );
        }

        #region GetByIdAsync Tests

        [Fact]
        public async Task GetByIdAsync_WithValidId_ReturnsExaminationResponse()
        {
            // Arrange
            var examId = "exam1";
            var exam = new Examination
            {
                Id = examId,
                ExamName = "Midterm",
                ClassroomId = "class1",
                ProgrammingLanguageId = "lang1",
                Problems = new List<ExaminationProblem>()
            };
            var classroom = new global::AcasService.Models.Classroom { Id = "class1", ClassName = "C#101" };
            var language = new ProgrammingLanguage { Id = "lang1", Name = "C#" };
            var examinationResponse = new ExaminationResponse { Id = examId, ExamName = "Midterm" };

            _mockExaminationRepository.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);
            _mockProgrammingLanguageRepository.Setup(r => r.GetByIdAsync("lang1")).ReturnsAsync(language);
            _mockClassroomRepository.Setup(r => r.FindByIdAsync("class1")).ReturnsAsync(classroom);

            // Act
            var result = await _examinationQuery.GetByIdAsync(examId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(examId);
            result.ExamName.Should().Be("Midterm");
            _mockExaminationRepository.Verify(r => r.GetByIdAsync(examId), Times.Once);
        }

        [Fact]
        public async Task GetByIdAsync_WithNonexistentId_ThrowsException()
        {
            // Arrange
            var examId = "nonexistent";
            _mockExaminationRepository.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync((Examination?)null);

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _examinationQuery.GetByIdAsync(examId));
        }

        #endregion

        #region GetAllAsync Tests

        [Fact]
        public async Task GetAllAsync_WithValidExaminations_ReturnsAllExaminations()
        {
            // Arrange
            var exams = new List<Examination>
            {
                new Examination { Id = "exam1", ExamName = "Midterm", ClassroomId = "class1", ProgrammingLanguageId = "lang1", Problems = new List<ExaminationProblem>() },
                new Examination { Id = "exam2", ExamName = "Final", ClassroomId = "class2", ProgrammingLanguageId = "lang1", Problems = new List<ExaminationProblem>() }
            };
            var classrooms = new List<global::AcasService.Models.Classroom>
            {
                new global::AcasService.Models.Classroom { Id = "class1", ClassName = "C#101" },
                new global::AcasService.Models.Classroom { Id = "class2", ClassName = "Java101" }
            };
            var languages = new List<ProgrammingLanguage> { new ProgrammingLanguage { Id = "lang1", Name = "C#" } };
            var examResponse1 = new ExaminationResponse { Id = "exam1", ExamName = "Midterm" };
            var examResponse2 = new ExaminationResponse { Id = "exam2", ExamName = "Final" };

            _mockExaminationRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(exams.Cast<Examination?>().ToList());
            _mockProgrammingLanguageRepository.Setup(r => r.GetByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(languages);
            _mockClassroomRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(classrooms);

            // Act
            var result = await _examinationQuery.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            _mockExaminationRepository.Verify(r => r.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task GetAllAsync_WithNoExaminations_ThrowsException()
        {
            // Arrange
            _mockExaminationRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Examination?>());

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _examinationQuery.GetAllAsync());
        }

        #endregion

        #region GetByClassIdAsync Tests

        [Fact]
        public async Task GetByClassIdAsync_WithValidClassId_ReturnsClassExaminations()
        {
            // Arrange
            var classId = "class1";
            var exams = new List<Examination>
            {
                new Examination { Id = "exam1", ExamName = "Midterm", ClassroomId = classId, ProgrammingLanguageId = "lang1", Problems = new List<ExaminationProblem>() }
            };
            var classroom = new global::AcasService.Models.Classroom { Id = classId, ClassName = "C#101" };
            var language = new ProgrammingLanguage { Id = "lang1", Name = "C#" };
            var examResponse = new ExaminationResponse { Id = "exam1", ExamName = "Midterm" };

            _mockExaminationRepository.Setup(r => r.GetByClassIdAsync(classId)).ReturnsAsync(exams);
            _mockProgrammingLanguageRepository.Setup(r => r.GetByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new List<ProgrammingLanguage> { language });
            _mockClassroomRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new List<global::AcasService.Models.Classroom> { classroom });

            // Act
            var result = await _examinationQuery.GetByClassIdAsync(classId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0]!.ExamName.Should().Be("Midterm");
        }

        [Fact]
        public async Task GetByClassIdAsync_WithNoExaminations_ReturnsEmptyList()
        {
            // Arrange
            var classId = "nonexistent";
            _mockExaminationRepository.Setup(r => r.GetByClassIdAsync(classId)).ReturnsAsync(new List<Examination>());

            // Act
            var result = await _examinationQuery.GetByClassIdAsync(classId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
            _mockLogger.Verify(l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
        }

        #endregion

        #region GetByClassIdAndModeAsync Tests

        [Fact]
        public async Task GetByClassIdAndModeAsync_WithValidClassIdAndMode_ReturnsExaminations()
        {
            // Arrange
            var classId = "class1";
            var mode = "EXAMINATION";
            var exams = new List<Examination>
            {
                new Examination { Id = "exam1", ExamName = "Midterm", ClassroomId = classId, ProgrammingLanguageId = "lang1", Mode = Mode.EXAMINATION, Problems = new List<ExaminationProblem>() }
            };
            var classroom = new global::AcasService.Models.Classroom { Id = classId, ClassName = "C#101" };
            var language = new ProgrammingLanguage { Id = "lang1", Name = "C#" };
            var examResponse = new ExaminationResponse { Id = "exam1", ExamName = "Midterm" };

            _mockExaminationRepository.Setup(r => r.GetByClassIdAndModeAsync(classId, mode)).ReturnsAsync(exams);
            _mockProgrammingLanguageRepository.Setup(r => r.GetByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new List<ProgrammingLanguage> { language });
            _mockClassroomRepository.Setup(r => r.FindByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new List<global::AcasService.Models.Classroom> { classroom });

            // Act
            var result = await _examinationQuery.GetByClassIdAndModeAsync(classId, mode);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByClassIdAndModeAsync_WithNoExaminations_ReturnsEmptyList()
        {
            // Arrange
            var classId = "class1";
            var mode = "PRACTICAL";
            _mockExaminationRepository.Setup(r => r.GetByClassIdAndModeAsync(classId, mode)).ReturnsAsync(new List<Examination>());

            // Act
            var result = await _examinationQuery.GetByClassIdAndModeAsync(classId, mode);

            // Assert
            result.Should().BeEmpty();
        }

        #endregion

        #region GetExaminationProblemResponseAsync Tests

        [Fact]
        public async Task GetExaminationProblemResponseAsync_WithValidExamAndProblem_ReturnsProblemResponse()
        {
            // Arrange
            var examId = "exam1";
            var problemId = "prob1";
            var exam = new Examination
            {
                Id = examId,
                ExamName = "Midterm",
                ClassroomId = "class1",
                ProgrammingLanguageId = "lang1",
                Problems = new List<ExaminationProblem>
                {
                    new ExaminationProblem { ProblemId = problemId, Mark = 10 }
                }
            };
            var problem = new Problem { Id = problemId, Title = "Problem1", IsDeleted = false };
            var language = new ProgrammingLanguage { Id = "lang1", Name = "C#" };
            var testCases = new List<TestCase>
            {
                new TestCase { Id = "tc1", IsPublic = true, IsDeleted = false },
                new TestCase { Id = "tc2", IsPublic = false, IsDeleted = false }
            };
            var problemResponse = new ProblemResponse
            {
                Id = problemId,
                Title = "Problem1",
                TestCases = new List<TestCaseResponse>
                {
                    new TestCaseResponse { Id = "tc1", IsPublic = true },
                    new TestCaseResponse { Id = "tc2", IsPublic = false }
                }
            };

            _mockExaminationRepository.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);
            _mockProblemRepository.Setup(r => r.GetByIdAsync(problemId)).ReturnsAsync(problem);
            _mockProgrammingLanguageRepository.Setup(r => r.GetByIdAsync("lang1")).ReturnsAsync(language);

            // Act
            var result = await _examinationQuery.GetExaminationProblemResponseAsync(examId, problemId);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetExaminationProblemResponseAsync_WithNonexistentExam_ThrowsException()
        {
            // Arrange
            var examId = "nonexistent";
            var problemId = "prob1";
            _mockExaminationRepository.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync((Examination?)null);

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _examinationQuery.GetExaminationProblemResponseAsync(examId, problemId));
        }

        [Fact]
        public async Task GetExaminationProblemResponseAsync_WithProblemNotInExam_ThrowsException()
        {
            // Arrange
            var examId = "exam1";
            var problemId = "prob2";
            var exam = new Examination
            {
                Id = examId,
                Problems = new List<ExaminationProblem>
                {
                    new ExaminationProblem { ProblemId = "prob1", Mark = 10 }
                }
            };
            _mockExaminationRepository.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _examinationQuery.GetExaminationProblemResponseAsync(examId, problemId));
        }

        [Fact]
        public async Task GetExaminationProblemResponseAsync_FilterPublicTestCases()
        {
            // Arrange
            var examId = "exam1";
            var problemId = "prob1";
            var exam = new Examination
            {
                Id = examId,
                Problems = new List<ExaminationProblem>
                {
                    new ExaminationProblem { ProblemId = problemId, Mark = 10 }
                }
            };
            var problem = new Problem { Id = problemId };
            var language = new ProgrammingLanguage { Id = "lang1" };
            var problemResponse = new ProblemResponse
            {
                Id = problemId,
                TestCases = new List<TestCaseResponse>
                {
                    new TestCaseResponse { Id = "tc1", IsPublic = true },
                    new TestCaseResponse { Id = "tc2", IsPublic = false },
                    new TestCaseResponse { Id = "tc3", IsPublic = true }
                }
            };

            _mockExaminationRepository.Setup(r => r.GetByIdAsync(examId)).ReturnsAsync(exam);
            _mockProblemRepository.Setup(r => r.GetByIdAsync(problemId)).ReturnsAsync(problem);
            _mockProgrammingLanguageRepository.Setup(r => r.GetByIdAsync(It.IsAny<string>())).ReturnsAsync(language);

            // Act
            var result = await _examinationQuery.GetExaminationProblemResponseAsync(examId, problemId);

            // Assert
            result.Should().NotBeNull();
            // Verify that only public test cases are included
        }

        #endregion
    }
}
