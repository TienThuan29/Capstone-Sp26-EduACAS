using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("DiscussionIssueTableName")]
public class DiscussionIssue
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty; // markdown

    public string[] Attachments { get; set; } = Array.Empty<string>();

    public string RefProblemId { get; set; } = string.Empty;

    public DiscussionIssueStatus Status { get; set; }

    public int ViewCount { get; set; }

    public List<Comment> Comments { get; set; } = new List<Comment>();

    public bool IsDeleted { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime UpdatedDate { get; set; }
}

public enum DiscussionIssueStatus
{
    OPEN,
    CLOSED
}

public class Comment
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string IssueId { get; set; } = string.Empty;
    
    [Required]
    public string AuthorId { get; set; } = string.Empty;
    
    public string AuthorName { get; set; } = string.Empty;
    
    [Required]
    public string Content { get; set; } = string.Empty; // markdown content
    
    public string[] Attachments { get; set; } = Array.Empty<string>();

    public int UpVoteCount { get; set; }

    public List<Models.Comment> Replies { get; set; } = new List<Models.Comment>();
    
    public bool IsDeleted { get; set; }
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime UpdatedDate { get; set; }
}