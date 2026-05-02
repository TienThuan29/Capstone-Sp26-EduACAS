using System.ComponentModel.DataAnnotations;
using AcasService.Models;

namespace AcasService.Web.Requests;

public class CreateDiscussionIssueRequest
{
    [Required]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public string RefProblemId { get; set; } = string.Empty;
}

public class UpdateDiscussionIssueRequest
{
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public string RefProblemId { get; set; } = string.Empty;
}

public class WriteCommentRequest
{
    [Required]
    public string IssueId { get; set; } = string.Empty;

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;
}

public class ReplyCommentRequest
{
    [Required]
    public string IssueId { get; set; } = string.Empty;

    [Required]
    public string ParentCommentId { get; set; } = string.Empty;

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;
}

public class UpvoteCommentRequest
{
    [Required]
    public string IssueId { get; set; } = string.Empty;

    [Required]
    public string CommentId { get; set; } = string.Empty;
}

public class ChangeDiscussionStatusRequest
{
    [Required]
    public string IssueId { get; set; } = string.Empty;

    public DiscussionIssueStatus Status { get; set; }
}

public class UpdateCommentRequest
{
    [Required]
    public string IssueId { get; set; } = string.Empty;

    [Required]
    public string CommentId { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;
}

public class SoftDeleteCommentRequest
{
    [Required]
    public string IssueId { get; set; } = string.Empty;

    [Required]
    public string CommentId { get; set; } = string.Empty;
}
