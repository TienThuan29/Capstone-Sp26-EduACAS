using AcasService.Application.Commands.ErrorGroup;
using AcasService.Models;
using AcasService.Repositories.ErrorGroup;
using AcasService.Repositories.Submission;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ErrorGroupCommandTests
{
    private readonly Mock<ISubmissionRepository> _mockSubmissionRepo;
    private readonly Mock<IErrorGroupRepository> _mockErrorGroupRepo;
    private readonly Mock<IJPlagCommand> _mockJPlag;
    private readonly Mock<ILogger<ErrorGroupCommand>> _mockLogger;
    private readonly ErrorGroupCommand _sut;

    public ErrorGroupCommandTests()
    {
        _mockSubmissionRepo = new Mock<ISubmissionRepository>();
        _mockErrorGroupRepo = new Mock<IErrorGroupRepository>();
        _mockJPlag = new Mock<IJPlagCommand>();
        _mockLogger = new Mock<ILogger<ErrorGroupCommand>>();

        _sut = new ErrorGroupCommand(
            _mockSubmissionRepo.Object,
            _mockErrorGroupRepo.Object,
            _mockJPlag.Object,
            _mockLogger.Object);
    }

    // ========================================================================
    // EG-01: Create error group
    // ========================================================================
    [Fact]
    public async Task GroupSubmissionsByErrorsAsync_WhenSubmissionsHaveMatchingErrors_CreatesGroups()
    {
        // Arrange
        var submissions = new List<Submission>
        {
            CreateSubmission("sub-1", "exam-1", "prob-1", SubmissionStatus.GRADED),
            CreateSubmission("sub-2", "exam-1", "prob-1", SubmissionStatus.GRADED)
        };

        submissions[0].TestResults = new List<TestResult>
        {
            new() { TestcaseId = "tc-1", Status = TestcaseStatus.FAIL, ActualOutput = "Error" }
        };
        submissions[1].TestResults = new List<TestResult>
        {
            new() { TestcaseId = "tc-1", Status = TestcaseStatus.FAIL, ActualOutput = "Error" }
        };

        _mockSubmissionRepo.Setup(x => x.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync("exam-1", "prob-1"))
            .ReturnsAsync(submissions);
        _mockErrorGroupRepo.Setup(x => x.DeleteByProblemIdPaginatedAsync("exam-1", "prob-1"))
            .Returns(Task.CompletedTask);
        _mockErrorGroupRepo.Setup(x => x.CreateAsync(It.IsAny<ErrorGroup>()))
            .ReturnsAsync((ErrorGroup g) => g);

        // Act
        var result = await _sut.GroupSubmissionsByErrorsAsync("exam-1", "prob-1");

        // Assert
        result.Should().BeGreaterThan(0);
        _mockErrorGroupRepo.Verify(x => x.CreateAsync(
            It.Is<ErrorGroup>(g => g.ExamId == "exam-1" && g.ProblemId == "prob-1")),
            Times.Once);
    }

    // ========================================================================
    // EG-02: Link compilation error
    // ========================================================================
    [Fact]
    public async Task GroupSubmissionsByErrorsAsync_WhenSubmissionsHaveDifferentErrors_ReturnsZero()
    {
        // Arrange
        var submissions = new List<Submission>
        {
            CreateSubmission("sub-1", "exam-1", "prob-1", SubmissionStatus.GRADED),
            CreateSubmission("sub-2", "exam-1", "prob-1", SubmissionStatus.GRADED)
        };

        submissions[0].TestResults = new List<TestResult>
        {
            new() { TestcaseId = "tc-1", Status = TestcaseStatus.FAIL, ActualOutput = "Error A" }
        };
        submissions[1].TestResults = new List<TestResult>
        {
            new() { TestcaseId = "tc-1", Status = TestcaseStatus.FAIL, ActualOutput = "Error B" } // different
        };

        _mockSubmissionRepo.Setup(x => x.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync("exam-1", "prob-1"))
            .ReturnsAsync(submissions);
        _mockErrorGroupRepo.Setup(x => x.DeleteByProblemIdPaginatedAsync("exam-1", "prob-1"))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.GroupSubmissionsByErrorsAsync("exam-1", "prob-1");

        // Assert
        result.Should().Be(0);
    }

    // ========================================================================
    // EG-03: Get errors by language
    // ========================================================================
    [Fact]
    public async Task GetByProblemIdAsync_ReturnsGroups()
    {
        // Arrange
        var groups = new List<ErrorGroup>
        {
            new() { Id = "eg-1", ExamId = "exam-1", ProblemId = "prob-1", ErrorSignature = "sig-1" },
            new() { Id = "eg-2", ExamId = "exam-1", ProblemId = "prob-1", ErrorSignature = "sig-2" }
        };

        _mockErrorGroupRepo.Setup(x => x.GetByProblemIdAsync("exam-1", "prob-1"))
            .ReturnsAsync(groups);

        // Act
        var result = await _sut.GetByProblemIdAsync("exam-1", "prob-1");

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task GroupSubmissionsByErrorsAsync_WhenNoGradedSubmissions_ReturnsZero()
    {
        // Arrange
        var submissions = new List<Submission>
        {
            CreateSubmission("sub-1", "exam-1", "prob-1", SubmissionStatus.PENDING)
        };

        _mockSubmissionRepo.Setup(x => x.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync("exam-1", "prob-1"))
            .ReturnsAsync(submissions);

        // Act
        var result = await _sut.GroupSubmissionsByErrorsAsync("exam-1", "prob-1");

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public async Task CheckSimilarityForProblemAsync_WhenNoGroupsExist_DoesNothing()
    {
        // Arrange
        _mockErrorGroupRepo.Setup(x => x.GetByProblemIdPaginatedAsync("exam-1", "prob-1"))
            .ReturnsAsync(new List<ErrorGroup>());

        // Act
        var act = async () => await _sut.CheckSimilarityForProblemAsync("exam-1", "prob-1");

        // Assert
        await act.Should().NotThrowAsync();
        _mockJPlag.Verify(x => x.RunSimilarityCheckAsync(It.IsAny<string>(), It.IsAny<List<Submission>>()), Times.Never);
    }

    [Fact]
    public async Task CheckSimilarityForGroupsAsync_WithValidGroups_RunsSimilarityCheck()
    {
        // Arrange
        var group = new ErrorGroup
        {
            Id = "eg-1",
            ExamId = "exam-1",
            ProblemId = "prob-1",
            SubmissionIds = new List<string> { "sub-1", "sub-2" }
        };

        var submissions = new List<Submission>
        {
            CreateSubmission("sub-1", "exam-1", "prob-1", SubmissionStatus.GRADED),
            CreateSubmission("sub-2", "exam-1", "prob-1", SubmissionStatus.GRADED)
        };

        var capturedGroups = new List<ErrorGroup>();

        _mockErrorGroupRepo.Setup(x => x.GetByIdAsync("eg-1")).ReturnsAsync(group);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync("sub-1")).ReturnsAsync(submissions[0]);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync("sub-2")).ReturnsAsync(submissions[1]);
        _mockJPlag.Setup(x => x.RunSimilarityCheckAsync("lang-1", It.IsAny<List<Submission>>()))
            .ReturnsAsync(new List<JPlagMatch>());
        _mockErrorGroupRepo.Setup(x => x.UpdateAsync(It.IsAny<ErrorGroup>()))
            .Callback<ErrorGroup>(g => capturedGroups.Add(new ErrorGroup
            {
                Id = g.Id,
                JPlagStatus = g.JPlagStatus,
                ExamId = g.ExamId,
                ProblemId = g.ProblemId,
                SubmissionIds = new List<string>(g.SubmissionIds)
            }))
            .ReturnsAsync((ErrorGroup g) => g);

        // Act
        await _sut.CheckSimilarityForGroupsAsync(new List<string> { "eg-1" });

        // Assert
        _mockJPlag.Verify(x => x.RunSimilarityCheckAsync("lang-1", It.IsAny<List<Submission>>()), Times.Once);
        capturedGroups.Should().HaveCount(2);
        capturedGroups[0].JPlagStatus.Should().Be(JPlagStatus.RUNNING);
        capturedGroups[1].JPlagStatus.Should().Be(JPlagStatus.COMPLETED);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsGroup()
    {
        // Arrange
        var group = new ErrorGroup { Id = "eg-1" };
        _mockErrorGroupRepo.Setup(x => x.GetByIdAsync("eg-1")).ReturnsAsync(group);

        // Act
        var result = await _sut.GetByIdAsync("eg-1");

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be("eg-1");
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static Submission CreateSubmission(string id, string examId, string problemId, SubmissionStatus status) => new()
    {
        Id = id,
        ExamId = examId,
        ProblemId = problemId,
        StudentId = "student-1",
        LanguageId = "lang-1",
        CompilerId = "comp-1",
        Source = "int main() {}",
        Version = 1,
        SubmittedDate = DateTime.UtcNow,
        FinalScore = 0,
        Status = status,
        TestResults = new List<TestResult>()
    };
}
