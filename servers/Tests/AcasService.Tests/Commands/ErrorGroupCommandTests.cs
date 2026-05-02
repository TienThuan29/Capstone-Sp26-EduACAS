using AcasService.Application.Commands.ErrorGroup;
using AcasService.Models;
using AcasService.Repositories.ErrorGroup;
using AcasService.Repositories.Problem;
using AcasService.Repositories.Submission;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcasService.Tests.Commands;

public class ErrorGroupCommandTests
{
    private readonly Mock<ISubmissionRepository> _submissionRepoMock;
    private readonly Mock<IErrorGroupRepository> _errorGroupRepoMock;
    private readonly Mock<IProblemRepository> _problemRepoMock;
    private readonly Mock<IJPlagCommand> _jplagCommandMock;
    private readonly Mock<ILogger<ErrorGroupCommand>> _loggerMock;
    private readonly ErrorGroupCommand _command;

    public ErrorGroupCommandTests()
    {
        _submissionRepoMock = new Mock<ISubmissionRepository>();
        _errorGroupRepoMock = new Mock<IErrorGroupRepository>();
        _problemRepoMock = new Mock<IProblemRepository>();
        _jplagCommandMock = new Mock<IJPlagCommand>();
        _loggerMock = new Mock<ILogger<ErrorGroupCommand>>();

        _command = new ErrorGroupCommand(
            _submissionRepoMock.Object,
            _errorGroupRepoMock.Object,
            _problemRepoMock.Object,
            _jplagCommandMock.Object,
            _loggerMock.Object
        );
    }

    private Models.Submission CreateGradedSubmission(string id, string errorSignaturePart)
    {
        return new Models.Submission
        {
            Id = id,
            Status = SubmissionStatus.GRADED,
            TestResults = new List<TestResult>
            {
                new TestResult { TestcaseId = "tc1", Status = TestcaseStatus.FAIL, ActualOutput = errorSignaturePart }
            }
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F054 | GroupSubmissionsByErrorsAsync
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UTCD01_GroupSubmissionsByErrorsAsync_GroupsFound_ReturnsCreatedCount()
    {
        var examId = "e1";
        var problemId = "p1";
        var s1 = CreateGradedSubmission("s1", "err1");
        var s2 = CreateGradedSubmission("s2", "err1");
        var s3 = CreateGradedSubmission("s3", "err2");

        _submissionRepoMock.Setup(r => r.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(examId, problemId))
            .ReturnsAsync(new List<Models.Submission> { s1, s2, s3 });
        
        _errorGroupRepoMock.Setup(r => r.CreateAsync(It.IsAny<Models.ErrorGroup>()))
            .ReturnsAsync(new Models.ErrorGroup());

        var result = await _command.GroupSubmissionsByErrorsAsync(examId, problemId);
        result.Should().Be(1);
    }

    [Fact]
    public async Task UTCD02_GroupSubmissionsByErrorsAsync_NoSubmissions_ReturnsZero()
    {
        var examId = "e1";
        var problemId = "p1";
        _submissionRepoMock.Setup(r => r.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(examId, problemId))
            .ReturnsAsync(new List<Models.Submission>());

        var result = await _command.GroupSubmissionsByErrorsAsync(examId, problemId);
        result.Should().Be(0);
    }

    [Fact]
    public async Task UTCD03_GroupSubmissionsByErrorsAsync_AllUnique_ReturnsZero()
    {
        var examId = "e1";
        var problemId = "p1";
        var s1 = CreateGradedSubmission("s1", "err1");
        var s2 = CreateGradedSubmission("s2", "err2");

        _submissionRepoMock.Setup(r => r.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(examId, problemId))
            .ReturnsAsync(new List<Models.Submission> { s1, s2 });

        var result = await _command.GroupSubmissionsByErrorsAsync(examId, problemId);
        result.Should().Be(0);
    }

    [Fact]
    public async Task UTCD04_GroupSubmissionsByErrorsAsync_GradedStatus_CreatesGroup()
    {
        var examId = "e1";
        var problemId = "p1";
        var s1 = CreateGradedSubmission("s1", "err1");
        var s2 = CreateGradedSubmission("s2", "err1");

        _submissionRepoMock.Setup(r => r.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(examId, problemId))
            .ReturnsAsync(new List<Models.Submission> { s1, s2 });
        
        _errorGroupRepoMock.Setup(r => r.CreateAsync(It.IsAny<Models.ErrorGroup>()))
            .ReturnsAsync(new Models.ErrorGroup());

        var result = await _command.GroupSubmissionsByErrorsAsync(examId, problemId);
        result.Should().BeGreaterThanOrEqualTo(1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F055 | CheckSimilarityForProblemAsync
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UTCD01_CheckSimilarityForProblemAsync_Success_UpdatesStatusToCompleted()
    {
        var examId = "e1";
        var problemId = "p1";
        var group = new Models.ErrorGroup { Id = "g1", JPlagStatus = JPlagStatus.PENDING, SubmissionIds = new List<string> { "s1", "s2" } };
        var submissions = new List<Models.Submission> { 
            new Models.Submission { Id = "s1", LanguageId = "java" }, 
            new Models.Submission { Id = "s2", LanguageId = "java" } 
        };

        _errorGroupRepoMock.Setup(r => r.GetByProblemIdPaginatedAsync(examId, problemId))
            .ReturnsAsync(new List<Models.ErrorGroup> { group });
        _submissionRepoMock.Setup(r => r.GetByIdAsync("s1")).ReturnsAsync(submissions[0]);
        _submissionRepoMock.Setup(r => r.GetByIdAsync("s2")).ReturnsAsync(submissions[1]);
        
        _jplagCommandMock.Setup(j => j.RunSimilarityCheckAsync(It.IsAny<string>(), It.IsAny<List<Models.Submission>>()))
            .ReturnsAsync(new List<JPlagMatch>());

        await _command.CheckSimilarityForProblemAsync(examId, problemId);

        group.JPlagStatus.Should().Be(JPlagStatus.COMPLETED);
    }

    [Fact]
    public async Task UTCD02_CheckSimilarityForProblemAsync_NoGroups_DoesNothing()
    {
        var examId = "e1";
        var problemId = "p1";
        _errorGroupRepoMock.Setup(r => r.GetByProblemIdPaginatedAsync(examId, problemId))
            .ReturnsAsync(new List<Models.ErrorGroup>());

        await _command.CheckSimilarityForProblemAsync(examId, problemId);

        _jplagCommandMock.Verify(j => j.RunSimilarityCheckAsync(It.IsAny<string>(), It.IsAny<List<Models.Submission>>()), Times.Never);
    }

    [Fact]
    public async Task UTCD03_CheckSimilarityForProblemAsync_JPlagFails_UpdatesStatusToFailed()
    {
        var examId = "e1";
        var problemId = "p1";
        var group = new Models.ErrorGroup { Id = "g1", JPlagStatus = JPlagStatus.PENDING, SubmissionIds = new List<string> { "s1", "s2" } };

        _errorGroupRepoMock.Setup(r => r.GetByProblemIdPaginatedAsync(examId, problemId))
            .ReturnsAsync(new List<Models.ErrorGroup> { group });
        _submissionRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Models.Submission { LanguageId = "java" });
        
        _jplagCommandMock.Setup(j => j.RunSimilarityCheckAsync(It.IsAny<string>(), It.IsAny<List<Models.Submission>>()))
            .ThrowsAsync(new Exception("JPlag engine error"));

        await _command.CheckSimilarityForProblemAsync(examId, problemId);

        group.JPlagStatus.Should().Be(JPlagStatus.FAILED);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F056 | CheckSimilarityForGroupsAsync
    // ──────────────────────────────────────────────────────────────────────────

    // UTCD-01 | Success - List of valid IDs (Normal)
    [Fact]
    public async Task UTCD01_CheckSimilarityForGroupsAsync_ValidIds_UpdatesStatus()
    {
        var groupIds = new List<string> { "g1", "g2" };
        var g1 = new Models.ErrorGroup { Id = "g1", JPlagStatus = JPlagStatus.PENDING, SubmissionIds = new List<string> { "s1", "s2" } };
        var g2 = new Models.ErrorGroup { Id = "g2", JPlagStatus = JPlagStatus.PENDING, SubmissionIds = new List<string> { "s3", "s4" } };
        
        _errorGroupRepoMock.Setup(r => r.GetByIdAsync("g1")).ReturnsAsync(g1);
        _errorGroupRepoMock.Setup(r => r.GetByIdAsync("g2")).ReturnsAsync(g2);
        _submissionRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Models.Submission { LanguageId = "java" });
        _jplagCommandMock.Setup(j => j.RunSimilarityCheckAsync(It.IsAny<string>(), It.IsAny<List<Models.Submission>>()))
            .ReturnsAsync(new List<JPlagMatch>());

        await _command.CheckSimilarityForGroupsAsync(groupIds);

        g1.JPlagStatus.Should().Be(JPlagStatus.COMPLETED);
        g2.JPlagStatus.Should().Be(JPlagStatus.COMPLETED);
    }

    // UTCD-02 | Empty list of IDs (Abnormal)
    [Fact]
    public async Task UTCD02_CheckSimilarityForGroupsAsync_EmptyList_DoesNothing()
    {
        await _command.CheckSimilarityForGroupsAsync(new List<string>());
        _errorGroupRepoMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
    }

    // UTCD-03 | List with nonexistent IDs (Abnormal)
    [Fact]
    public async Task UTCD03_CheckSimilarityForGroupsAsync_NonexistentIds_DoesNothing()
    {
        var groupIds = new List<string> { "nonexistent" };
        _errorGroupRepoMock.Setup(r => r.GetByIdAsync("nonexistent")).ReturnsAsync((Models.ErrorGroup?)null);

        await _command.CheckSimilarityForGroupsAsync(groupIds);

        _jplagCommandMock.Verify(j => j.RunSimilarityCheckAsync(It.IsAny<string>(), It.IsAny<List<Models.Submission>>()), Times.Never);
    }
}
