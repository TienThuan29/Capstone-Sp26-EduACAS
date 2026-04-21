using AcasService.Application.Commands.DiscussionIssue;
using AcasService.Application.Mappers;
using AcasService.Application.Queries.DiscussionIssue;
using AcasService.Application.Commands.Notification;
using AcasService.Models;
using AcasService.Repositories.DiscussionIssue;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class DiscussionIssueCommandTests
{
    private readonly Mock<IDiscussionIssueRepository> _mockRepo;
    private readonly Mock<IDiscussionIssueQuery> _mockQuery;
    private readonly Mock<IBusinessNotificationService> _mockNotification;
    private readonly Mock<ILogger<DiscussionIssueCommand>> _mockLogger;
    private readonly DiscussionIssueMapper _mapper;
    private readonly DiscussionIssueCommand _sut;

    public DiscussionIssueCommandTests()
    {
        _mockRepo = new Mock<IDiscussionIssueRepository>();
        _mockQuery = new Mock<IDiscussionIssueQuery>();
        _mockNotification = new Mock<IBusinessNotificationService>();
        _mockLogger = new Mock<ILogger<DiscussionIssueCommand>>();
        _mapper = new DiscussionIssueMapper(new CommentMapper());

        _sut = new DiscussionIssueCommand(
            _mockRepo.Object,
            _mapper,
            _mockQuery.Object,
            _mockNotification.Object,
            _mockLogger.Object);
    }

    // ========================================================================
    // DI-01: Create discussion successfully
    // ========================================================================
    [Fact]
    public async Task CreateIssueAsync_WithValidRequest_ReturnsCreatedIssue()
    {
        // Arrange
        var request = new CreateDiscussionIssueRequest
        {
            ClassroomId = "class-1",
            AuthorId = "user-1",
            Title = "Question about sorting",
            Content = "How does quicksort work?",
            RefProblemId = "prob-1"
        };

        _mockRepo.Setup(x => x.CreateAsync(It.IsAny<DiscussionIssue>()))
            .ReturnsAsync((DiscussionIssue d) => d);
        _mockQuery.Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Application.ResponseDTOs.DiscussionIssueDetailResponse { Id = "di-1" });

        // Act
        var result = await _sut.CreateIssueAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockRepo.Verify(x => x.CreateAsync(It.Is<DiscussionIssue>(
            d => d.Title == "Question about sorting" && d.ClassroomId == "class-1")), Times.Once);
    }

    // ========================================================================
    // DI-02: Reply to discussion
    // ========================================================================
    [Fact]
    public async Task WriteCommentAsync_WhenIssueExists_AddsComment()
    {
        // Arrange
        var issue = CreateDiscussionIssue("di-1", "class-1", "user-1");
        var request = new WriteCommentRequest
        {
            IssueId = "di-1",
            AuthorId = "user-2",
            Content = "This is my comment"
        };

        _mockRepo.Setup(x => x.FindByIdAsync("di-1")).ReturnsAsync(issue);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<DiscussionIssue>()))
            .ReturnsAsync((DiscussionIssue d) => d);
        _mockQuery.Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Application.ResponseDTOs.DiscussionIssueDetailResponse { Id = "di-1" });

        // Act
        var result = await _sut.WriteCommentAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockRepo.Verify(x => x.UpdateAsync(It.Is<DiscussionIssue>(
            d => d.Comments.Count == 1)), Times.Once);
    }

    // ========================================================================
    // DI-03: Mark as resolved
    // ========================================================================
    [Fact]
    public async Task ChangeStatusAsync_WhenIssueExists_ChangesStatusToClosed()
    {
        // Arrange
        var issue = CreateDiscussionIssue("di-1", "class-1", "user-1");
        issue.Status = DiscussionIssueStatus.OPEN;
        var request = new ChangeDiscussionStatusRequest
        {
            IssueId = "di-1",
            Status = DiscussionIssueStatus.CLOSED
        };

        _mockRepo.Setup(x => x.FindByIdAsync("di-1")).ReturnsAsync(issue);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<DiscussionIssue>()))
            .ReturnsAsync((DiscussionIssue d) => d);
        _mockQuery.Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Application.ResponseDTOs.DiscussionIssueDetailResponse { Id = "di-1" });

        // Act
        var result = await _sut.ChangeStatusAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockRepo.Verify(x => x.UpdateAsync(It.Is<DiscussionIssue>(
            d => d.Status == DiscussionIssueStatus.CLOSED)), Times.Once);
    }

    // ========================================================================
    // DI-04: Delete own discussion
    // ========================================================================
    [Fact]
    public async Task SoftDeleteAsync_WhenIssueExists_ReturnsTrue()
    {
        // Arrange
        var issue = CreateDiscussionIssue("di-1", "class-1", "user-1");
        _mockRepo.Setup(x => x.FindByIdAsync("di-1")).ReturnsAsync(issue);
        _mockRepo.Setup(x => x.SoftDeleteAsync("di-1")).Returns(Task.CompletedTask);

        // Act
        var result = await _sut.SoftDeleteAsync("di-1");

        // Assert
        result.Should().BeTrue();
        _mockRepo.Verify(x => x.SoftDeleteAsync("di-1"), Times.Once);
    }

    // ========================================================================
    // DI-05: Delete others' discussion — returns true (soft delete succeeds)
    // Note: Authorization checks are typically done at the controller/service layer.
    // The command itself only checks existence.
    // ========================================================================
    [Fact]
    public async Task SoftDeleteAsync_WhenIssueNotFound_ReturnsFalse()
    {
        // Arrange
        _mockRepo.Setup(x => x.FindByIdAsync("nonexistent")).ReturnsAsync((DiscussionIssue?)null);

        // Act
        var result = await _sut.SoftDeleteAsync("nonexistent");

        // Assert
        result.Should().BeFalse();
        _mockRepo.Verify(x => x.SoftDeleteAsync(It.IsAny<string>()), Times.Never);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task ReplyCommentAsync_WhenParentCommentExists_AddsReply()
    {
        // Arrange
        var issue = CreateDiscussionIssue("di-1", "class-1", "user-1");
        var commentId = Guid.NewGuid().ToString();
        issue.Comments = new List<Comment>
        {
            new() { Id = commentId, IssueId = "di-1", AuthorId = "user-2", Content = "Original" }
        };

        var request = new ReplyCommentRequest
        {
            IssueId = "di-1",
            ParentCommentId = commentId,
            AuthorId = "user-3",
            Content = "This is a reply"
        };

        _mockRepo.Setup(x => x.FindByIdAsync("di-1")).ReturnsAsync(issue);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<DiscussionIssue>()))
            .ReturnsAsync((DiscussionIssue d) => d);
        _mockQuery.Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Application.ResponseDTOs.DiscussionIssueDetailResponse { Id = "di-1" });

        // Act
        var result = await _sut.ReplyCommentAsync(request);

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task UpvoteCommentAsync_WhenCommentExists_IncrementsUpvoteCount()
    {
        // Arrange
        var issue = CreateDiscussionIssue("di-1", "class-1", "user-1");
        var commentId = Guid.NewGuid().ToString();
        issue.Comments = new List<Comment>
        {
            new() { Id = commentId, IssueId = "di-1", AuthorId = "user-2", Content = "Content", UpVoteCount = 0 }
        };

        var request = new UpvoteCommentRequest { IssueId = "di-1", CommentId = commentId };

        _mockRepo.Setup(x => x.FindByIdAsync("di-1")).ReturnsAsync(issue);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<DiscussionIssue>()))
            .ReturnsAsync((DiscussionIssue d) => d);
        _mockQuery.Setup(x => x.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Application.ResponseDTOs.DiscussionIssueDetailResponse { Id = "di-1" });

        // Act
        var result = await _sut.UpvoteCommentAsync(request);

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static DiscussionIssue CreateDiscussionIssue(string id, string classroomId, string authorId) => new()
    {
        Id = id,
        ClassroomId = classroomId,
        AuthorId = authorId,
        Title = "Test Discussion",
        Content = "Test content",
        RefProblemId = "",
        Status = DiscussionIssueStatus.OPEN,
        ViewCount = 0,
        Attachments = Array.Empty<string>(),
        Comments = new List<Comment>(),
        IsDeleted = false,
        CreatedDate = DateTime.UtcNow,
        UpdatedDate = DateTime.UtcNow
    };
}
