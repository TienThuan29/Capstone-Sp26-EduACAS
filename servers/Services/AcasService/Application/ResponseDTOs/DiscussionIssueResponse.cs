using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

/// <summary>
/// Response for discussion issue list (e.g. discussion-list UI: title, tags, viewCount, commentCount).
/// </summary>
public class DiscussionIssueListResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("viewCount")]
    public int ViewCount { get; set; }

    [JsonPropertyName("commentCount")]
    public int CommentCount { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("status")]
    public DiscussionIssueStatus Status { get; set; }

    [JsonPropertyName("tags")]
    public string[] Tags { get; set; } = Array.Empty<string>();
}

/// <summary>
/// Full discussion issue for detail view (issue + comments tree).
/// </summary>
public class DiscussionIssueDetailResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("authorId")]
    public string AuthorId { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("attachments")]
    public string[] Attachments { get; set; } = Array.Empty<string>();

    [JsonPropertyName("refProblemId")]
    public string RefProblemId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public DiscussionIssueStatus Status { get; set; }

    [JsonPropertyName("viewCount")]
    public int ViewCount { get; set; }

    [JsonPropertyName("comments")]
    public List<CommentResponse> Comments { get; set; } = new();

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
}

/// <summary>
/// Comment (or reply) in a discussion.
/// </summary>
public class CommentResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("issueId")]
    public string IssueId { get; set; } = string.Empty;

    [JsonPropertyName("authorId")]
    public string AuthorId { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("attachments")]
    public string[] Attachments { get; set; } = Array.Empty<string>();

    [JsonPropertyName("upVoteCount")]
    public int UpVoteCount { get; set; }

    [JsonPropertyName("replies")]
    public List<CommentResponse> Replies { get; set; } = new();

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
}
