using Moq;
using Xunit;
using FluentAssertions;
using AcasService.Application.Queries.Problem;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Queries.S3;
using AcasService.Models;
using AcasService.Repositories.Problem;
using Microsoft.Extensions.Logging;

namespace AcasService.Tests.Queries
{
    public class ProblemQueryTests
    {
        private readonly Mock<IProblemRepository> _mockProblemRepository;
        private readonly Mock<IPrivateS3Query> _mockPrivateS3Query;
        private readonly Mock<ILogger<ProblemQuery>> _mockLogger;
        private readonly ProblemQuery _problemQuery;

        public ProblemQueryTests()
        {
            _mockProblemRepository = new Mock<IProblemRepository>();
            _mockPrivateS3Query = new Mock<IPrivateS3Query>();
            _mockLogger = new Mock<ILogger<ProblemQuery>>();

            _problemQuery = new ProblemQuery(
                _mockProblemRepository.Object,
                _mockPrivateS3Query.Object,
                _mockLogger.Object
            );
        }

        #region GetProblemByIdAsync Tests

        [Fact]
        public async Task GetProblemByIdAsync_WithValidId_ReturnsProblemResponse()
        {
            // Arrange
            var problemId = "prob1";
            var problem = new Problem
            {
                Id = problemId,
                Title = "Add Two Numbers",
                Content = "Add two numbers",
                Difficulty = Difficulty.EASY,
                IsDeleted = false,
                FileName = "problem1.pdf",
                TestCases = new List<TestCase>()
            };
            var testCases = new List<TestCase>();

            _mockProblemRepository.Setup(r => r.GetByIdAsync(problemId)).ReturnsAsync(problem);
            _mockProblemRepository.Setup(r => r.GetTestCasesByProblemIdAsync(problemId)).ReturnsAsync(testCases);
            _mockPrivateS3Query.Setup(q => q.GetFileUrlAsync("problem1.pdf")).ReturnsAsync("https://s3.amazonaws.com/problem1.pdf");

            // Act
            var result = await _problemQuery.GetProblemByIdAsync(problemId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(problemId);
            result.Title.Should().Be("Add Two Numbers");
            _mockProblemRepository.Verify(r => r.GetByIdAsync(problemId), Times.Once);
        }

        [Fact]
        public async Task GetProblemByIdAsync_WithDeletedProblem_ReturnsNull()
        {
            // Arrange
            var problemId = "prob1";
            var problem = new Problem { Id = problemId, IsDeleted = true };

            _mockProblemRepository.Setup(r => r.GetByIdAsync(problemId)).ReturnsAsync(problem);

            // Act
            var result = await _problemQuery.GetProblemByIdAsync(problemId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetProblemByIdAsync_WithNonexistentId_ReturnsNull()
        {
            // Arrange
            var problemId = "nonexistent";
            _mockProblemRepository.Setup(r => r.GetByIdAsync(problemId)).ReturnsAsync((Problem?)null);

            // Act
            var result = await _problemQuery.GetProblemByIdAsync(problemId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetProblemByIdAsync_WithS3FileUrlError_ContinuesWithoutUrl()
        {
            // Arrange
            var problemId = "prob1";
            var problem = new Problem
            {
                Id = problemId,
                Title = "Add Two Numbers",
                FileName = "problem1.pdf",
                IsDeleted = false,
                TestCases = new List<TestCase>()
            };

            _mockProblemRepository.Setup(r => r.GetByIdAsync(problemId)).ReturnsAsync(problem);
            _mockProblemRepository.Setup(r => r.GetTestCasesByProblemIdAsync(problemId)).ReturnsAsync(new List<TestCase>());
            _mockPrivateS3Query.Setup(q => q.GetFileUrlAsync("problem1.pdf")).ThrowsAsync(new Exception("S3 error"));

            // Act
            var result = await _problemQuery.GetProblemByIdAsync(problemId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(problemId);
            _mockLogger.Verify(l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
        }

        #endregion

        #region GetProblemsByIdsAsync Tests

        [Fact]
        public async Task GetProblemsByIdsAsync_WithValidIds_ReturnsProblems()
        {
            // Arrange
            var problemIds = new List<string> { "prob1", "prob2" };
            var problems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Problem1", IsDeleted = false, FileName = "file1.pdf" },
                new Problem { Id = "prob2", Title = "Problem2", IsDeleted = false, FileName = "file2.pdf" }
            };
            var fileUrls = new Dictionary<string, string>
            {
                { "file1.pdf", "https://s3.amazonaws.com/file1.pdf" },
                { "file2.pdf", "https://s3.amazonaws.com/file2.pdf" }
            };

            _mockProblemRepository.Setup(r => r.GetByIdsAsync(problemIds)).ReturnsAsync(problems);
            _mockPrivateS3Query.Setup(q => q.GetFileUrlsAsync(It.IsAny<List<string>>())).ReturnsAsync(fileUrls);

            // Act
            var result = await _problemQuery.GetProblemsByIdsAsync(problemIds);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result[0].Id.Should().Be("prob1");
            result[1].Id.Should().Be("prob2");
        }

        [Fact]
        public async Task GetProblemsByIdsAsync_WithDeletedProblems_ExcludesDeleted()
        {
            // Arrange
            var problemIds = new List<string> { "prob1", "prob2" };
            var problems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Problem1", IsDeleted = false },
                new Problem { Id = "prob2", Title = "Problem2", IsDeleted = true }
            };

            _mockProblemRepository.Setup(r => r.GetByIdsAsync(problemIds)).ReturnsAsync(problems);
            _mockPrivateS3Query.Setup(q => q.GetFileUrlsAsync(It.IsAny<List<string>>())).ReturnsAsync(new Dictionary<string, string>());

            // Act
            var result = await _problemQuery.GetProblemsByIdsAsync(problemIds);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Id.Should().Be("prob1");
        }

        #endregion

        #region GetProblemsByExamIdAsync Tests

        [Fact]
        public async Task GetProblemsByExamIdAsync_WithValidExamId_ReturnsProblemsList()
        {
            // Arrange
            var examId = "exam1";
            var problems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Problem1", Difficulty = Difficulty.EASY, IsDeleted = false, Tags = new[] { "array" }, TestCases = new List<TestCase> { new TestCase { IsDeleted = false } } },
                new Problem { Id = "prob2", Title = "Problem2", Difficulty = Difficulty.HARD, IsDeleted = false, Tags = new[] { "dp" }, TestCases = new List<TestCase> { new TestCase { IsDeleted = false }, new TestCase { IsDeleted = true } } }
            };

            _mockProblemRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(problems);

            // Act
            var result = await _problemQuery.GetProblemsByExamIdAsync(examId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result[0].Title.Should().Be("Problem1");
            result[0].TestCasesCount.Should().Be(1);
            result[1].TestCasesCount.Should().Be(1);
        }

        [Fact]
        public async Task GetProblemsByExamIdAsync_WithNoProblems_ReturnsEmptyList()
        {
            // Arrange
            var examId = "nonexistent";
            _mockProblemRepository.Setup(r => r.GetByExamIdAsync(examId)).ReturnsAsync(new List<Problem>());

            // Act
            var result = await _problemQuery.GetProblemsByExamIdAsync(examId);

            // Assert
            result.Should().BeEmpty();
        }

        #endregion

        #region GetProblemsByLecturerIdAsync Tests

        [Fact]
        public async Task GetProblemsByLecturerIdAsync_WithValidLecturerId_ReturnsProblemsList()
        {
            // Arrange
            var lecturerId = "lecturer1";
            var problems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Problem1", Difficulty = Difficulty.EASY, IsDeleted = false, Tags = new[] { "array" }, TestCases = new List<TestCase>() }
            };

            _mockProblemRepository.Setup(r => r.GetByLecturerIdAsync(lecturerId)).ReturnsAsync(problems);

            // Act
            var result = await _problemQuery.GetProblemsByLecturerIdAsync(lecturerId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Title.Should().Be("Problem1");
        }

        [Fact]
        public async Task GetProblemsByLecturerIdAsync_WithNoProblems_ReturnsEmptyList()
        {
            // Arrange
            var lecturerId = "nonexistent";
            _mockProblemRepository.Setup(r => r.GetByLecturerIdAsync(lecturerId)).ReturnsAsync(new List<Problem>());

            // Act
            var result = await _problemQuery.GetProblemsByLecturerIdAsync(lecturerId);

            // Assert
            result.Should().BeEmpty();
        }

        #endregion

        #region GetProblemsByLecturerIdPagedAsync Tests

        [Fact]
        public async Task GetProblemsByLecturerIdPagedAsync_WithValidParameters_ReturnsPaginatedProblems()
        {
            // Arrange
            var lecturerId = "lecturer1";
            var allProblems = Enumerable.Range(1, 25)
                .Select(i => new Problem
                {
                    Id = $"prob{i}",
                    Title = $"Problem{i}",
                    Difficulty = i % 2 == 0 ? Difficulty.HARD : Difficulty.EASY,
                    IsDeleted = false,
                    Tags = new[] { "tag" },
                    TestCases = new List<TestCase>()
                })
                .ToList();

            _mockProblemRepository.Setup(r => r.GetByLecturerIdAsync(lecturerId)).ReturnsAsync(allProblems);

            // Act
            var result = await _problemQuery.GetProblemsByLecturerIdPagedAsync(lecturerId, 1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(10);
            result.TotalCount.Should().Be(25);
            result.PageIndex.Should().Be(1);
            result.PageSize.Should().Be(10);
        }

        [Fact]
        public async Task GetProblemsByLecturerIdPagedAsync_WithSearchTerm_FiltersProblems()
        {
            // Arrange
            var lecturerId = "lecturer1";
            var allProblems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Add Two Numbers", Difficulty = Difficulty.EASY, IsDeleted = false, TestCases = new List<TestCase>() },
                new Problem { Id = "prob2", Title = "Sort Array", Difficulty = Difficulty.MEDIUM, IsDeleted = false, TestCases = new List<TestCase>() }
            };

            _mockProblemRepository.Setup(r => r.GetByLecturerIdAsync(lecturerId)).ReturnsAsync(allProblems);

            // Act
            var result = await _problemQuery.GetProblemsByLecturerIdPagedAsync(lecturerId, 1, 10, "Add");

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.Items[0].Title.Should().Contain("Add");
        }

        [Fact]
        public async Task GetProblemsByLecturerIdPagedAsync_WithDifficultyFilter_FiltersByDifficulty()
        {
            // Arrange
            var lecturerId = "lecturer1";
            var allProblems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Easy Problem", Difficulty = Difficulty.EASY, IsDeleted = false, TestCases = new List<TestCase>() },
                new Problem { Id = "prob2", Title = "Hard Problem", Difficulty = Difficulty.HARD, IsDeleted = false, TestCases = new List<TestCase>() }
            };

            _mockProblemRepository.Setup(r => r.GetByLecturerIdAsync(lecturerId)).ReturnsAsync(allProblems);

            // Act
            var result = await _problemQuery.GetProblemsByLecturerIdPagedAsync(lecturerId, 1, 10, null, "Hard");

            // Assert
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(1);
            result.Items[0].Difficulty.Should().Be(Difficulty.HARD);
        }

        [Fact]
        public async Task GetProblemsByLecturerIdPagedAsync_WithInvalidPageSize_CaptsPageSizeTo100()
        {
            // Arrange
            var lecturerId = "lecturer1";
            var allProblems = Enumerable.Range(1, 150)
                .Select(i => new Problem
                {
                    Id = $"prob{i}",
                    Title = $"Problem{i}",
                    Difficulty = Difficulty.EASY,
                    IsDeleted = false,
                    TestCases = new List<TestCase>()
                })
                .ToList();

            _mockProblemRepository.Setup(r => r.GetByLecturerIdAsync(lecturerId)).ReturnsAsync(allProblems);

            // Act
            var result = await _problemQuery.GetProblemsByLecturerIdPagedAsync(lecturerId, 1, 150);

            // Assert
            result.Should().NotBeNull();
            result.PageSize.Should().Be(100);
            result.Items.Should().HaveCount(100);
        }

        #endregion

        #region GetAllProblemsAsync Tests

        [Fact]
        public async Task GetAllProblemsAsync_WithValidProblems_ReturnsAllProblems()
        {
            // Arrange
            var problems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Problem1", Difficulty = Difficulty.EASY, IsDeleted = false, TestCases = new List<TestCase>() },
                new Problem { Id = "prob2", Title = "Problem2", Difficulty = Difficulty.HARD, IsDeleted = false, TestCases = new List<TestCase>() }
            };

            _mockProblemRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(problems);

            // Act
            var result = await _problemQuery.GetAllProblemsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetAllProblemsAsync_ExcludesDeletedProblems()
        {
            // Arrange
            var problems = new List<Problem>
            {
                new Problem { Id = "prob1", Title = "Problem1", IsDeleted = false, TestCases = new List<TestCase>() },
                new Problem { Id = "prob2", Title = "Problem2", IsDeleted = true, TestCases = new List<TestCase>() }
            };

            _mockProblemRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(problems);

            // Act
            var result = await _problemQuery.GetAllProblemsAsync();

            // Assert
            result.Should().HaveCount(1);
            result[0].Id.Should().Be("prob1");
        }

        #endregion

        #region GetTestCasesByProblemIdAsync Tests

        [Fact]
        public async Task GetTestCasesByProblemIdAsync_WithValidProblemId_ReturnsTestCases()
        {
            // Arrange
            var problemId = "prob1";
            var testCases = new List<TestCase>
            {
                new TestCase { Id = "tc1", ProblemId = problemId, InputData = "1 2", ExpectedOutput = "3", IsDeleted = false, IsPublic = true },
                new TestCase { Id = "tc2", ProblemId = problemId, InputData = "5 10", ExpectedOutput = "15", IsDeleted = false, IsPublic = true }
            };

            _mockProblemRepository.Setup(r => r.GetTestCasesByProblemIdAsync(problemId)).ReturnsAsync(testCases);

            // Act
            var result = await _problemQuery.GetTestCasesByProblemIdAsync(problemId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result[0].InputData.Should().Be("1 2");
        }

        [Fact]
        public async Task GetTestCasesByProblemIdAsync_ExcludesDeletedTestCases()
        {
            // Arrange
            var problemId = "prob1";
            var testCases = new List<TestCase>
            {
                new TestCase { Id = "tc1", ProblemId = problemId, IsDeleted = false },
                new TestCase { Id = "tc2", ProblemId = problemId, IsDeleted = true }
            };

            _mockProblemRepository.Setup(r => r.GetTestCasesByProblemIdAsync(problemId)).ReturnsAsync(testCases);

            // Act
            var result = await _problemQuery.GetTestCasesByProblemIdAsync(problemId);

            // Assert
            result.Should().HaveCount(1);
        }

        #endregion

        #region GetTestCaseAsync Tests

        [Fact]
        public async Task GetTestCaseAsync_WithValidIds_ReturnsTestCase()
        {
            // Arrange
            var problemId = "prob1";
            var testCaseId = "tc1";
            var testCase = new TestCase { Id = testCaseId, ProblemId = problemId, InputData = "1 2", ExpectedOutput = "3", IsDeleted = false };

            _mockProblemRepository.Setup(r => r.GetTestCaseAsync(problemId, testCaseId)).ReturnsAsync(testCase);

            // Act
            var result = await _problemQuery.GetTestCaseAsync(problemId, testCaseId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(testCaseId);
            result.InputData.Should().Be("1 2");
        }

        [Fact]
        public async Task GetTestCaseAsync_WithNonexistentId_ReturnsNull()
        {
            // Arrange
            var problemId = "prob1";
            var testCaseId = "nonexistent";

            _mockProblemRepository.Setup(r => r.GetTestCaseAsync(problemId, testCaseId)).ReturnsAsync((TestCase?)null);

            // Act
            var result = await _problemQuery.GetTestCaseAsync(problemId, testCaseId);

            // Assert
            result.Should().BeNull();
        }

        #endregion
    }
}
