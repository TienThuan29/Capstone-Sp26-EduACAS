using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class CommentMapper
{
    /// <summary>Comment model → CommentResponse (includes nested Replies).</summary>
    public CommentResponse ToResponse(Comment comment)
    {
        return new CommentResponse
        {
            Id = comment.Id,
            IssueId = comment.IssueId,
            AuthorId = comment.AuthorId,
            Content = comment.Content,
            Attachments = comment.Attachments ?? Array.Empty<string>(),
            UpVoteCount = comment.UpVoteCount,
            Replies = comment.Replies?.Select(ToResponse).ToList() ?? new List<CommentResponse>(),
            IsDeleted = comment.IsDeleted,
            CreatedDate = comment.CreatedDate,
            UpdatedDate = comment.UpdatedDate
        };
    }

    /// <summary>CommentResponse → Comment model (includes nested Replies).</summary>
    public Comment FromResponse(CommentResponse response)
    {
        return new Comment
        {
            Id = response.Id,
            IssueId = response.IssueId,
            AuthorId = response.AuthorId,
            Content = response.Content,
            Attachments = response.Attachments ?? Array.Empty<string>(),
            UpVoteCount = response.UpVoteCount,
            Replies = response.Replies?.Select(FromResponse).ToList() ?? new List<Comment>(),
            IsDeleted = response.IsDeleted,
            CreatedDate = response.CreatedDate,
            UpdatedDate = response.UpdatedDate
        };
    }
}


public class DiscussionIssueMapper
{
    private readonly CommentMapper _commentMapper;

    public DiscussionIssueMapper(CommentMapper commentMapper)
    {
        _commentMapper = commentMapper;
    }

    /// <summary>DiscussionIssue → list item response (title, viewCount, commentCount, etc.).</summary>
    public DiscussionIssueListResponse ToListResponse(DiscussionIssue issue)
    {
        return new DiscussionIssueListResponse
        {
            Id = issue.Id,
            Title = issue.Title,
            AuthorId = issue.AuthorId ?? string.Empty,
            ViewCount = issue.ViewCount,
            CommentCount = CountComments(issue.Comments),
            CreatedDate = issue.CreatedDate,
            Status = issue.Status,
            Tags = Array.Empty<string>(),
            RefProblemId = issue.RefProblemId ?? string.Empty,
            RefProblemTitle = string.Empty,
            IsDeleted = issue.IsDeleted
        };
    }

    /// <summary>DiscussionIssue → full detail response (includes comments tree).</summary>
    public DiscussionIssueDetailResponse ToDetailResponse(DiscussionIssue issue)
    {
        return new DiscussionIssueDetailResponse
        {
            Id = issue.Id,
            ClassroomId = issue.ClassroomId,
            Title = issue.Title,
            AuthorId = issue.AuthorId,
            Content = issue.Content,
            Attachments = issue.Attachments ?? Array.Empty<string>(),
            RefProblemId = issue.RefProblemId ?? string.Empty,
            Status = issue.Status,
            ViewCount = issue.ViewCount,
            Comments = issue.Comments?.Select(_commentMapper.ToResponse).ToList() ?? new List<CommentResponse>(),
            IsDeleted = issue.IsDeleted,
            CreatedDate = issue.CreatedDate,
            UpdatedDate = issue.UpdatedDate
        };
    }

    /// <summary>DiscussionIssueDetailResponse → DiscussionIssue model (e.g. for updates).</summary>
    public DiscussionIssue FromDetailResponse(DiscussionIssueDetailResponse response)
    {
        return new DiscussionIssue
        {
            Id = response.Id,
            ClassroomId = response.ClassroomId,
            Title = response.Title,
            AuthorId = response.AuthorId,
            Content = response.Content,
            Attachments = response.Attachments ?? Array.Empty<string>(),
            RefProblemId = response.RefProblemId ?? string.Empty,
            Status = response.Status,
            ViewCount = response.ViewCount,
            Comments = response.Comments?.Select(_commentMapper.FromResponse).ToList() ?? new List<Comment>(),
            IsDeleted = response.IsDeleted,
            CreatedDate = response.CreatedDate,
            UpdatedDate = response.UpdatedDate
        };
    }

    private int CountComments(IList<Comment>? comments)
    {
        if (comments == null || comments.Count == 0) return 0;
        int n = comments.Count;
        foreach (var c in comments)
            n += CountComments(c.Replies);
        return n;
    }
}