using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.DiscussionIssue;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.DiscussionIssue;

public interface IDiscussionIssueCommand
{
      Task<DiscussionIssueDetailResponse?> CreateIssueAsync(CreateDiscussionIssueRequest request);

      Task<DiscussionIssueDetailResponse?> WriteCommentAsync(WriteCommentRequest request);

      Task<DiscussionIssueDetailResponse?> ReplyCommentAsync(ReplyCommentRequest request);

      Task<DiscussionIssueDetailResponse?> UpvoteCommentAsync(UpvoteCommentRequest request);

      Task<DiscussionIssueDetailResponse?> ChangeStatusAsync(ChangeDiscussionStatusRequest request);

      Task<bool> SoftDeleteAsync(string issueId);
}


public class DiscussionIssueCommand : IDiscussionIssueCommand
{
      private readonly IDiscussionIssueRepository _repository;
      private readonly DiscussionIssueMapper _discussionIssueMapper;
      private readonly ILogger<DiscussionIssueCommand> _logger;

      public DiscussionIssueCommand(
          IDiscussionIssueRepository repository,
          DiscussionIssueMapper discussionIssueMapper,
          ILogger<DiscussionIssueCommand> logger)
      {
            _repository = repository;
            _discussionIssueMapper = discussionIssueMapper;
            _logger = logger;
      }

      public async Task<DiscussionIssueDetailResponse?> CreateIssueAsync(CreateDiscussionIssueRequest request)
      {
            var issue = new Models.DiscussionIssue
            {
                  Id = Guid.NewGuid().ToString(),
                  ClassroomId = request.ClassroomId,
                  Title = request.Title,
                  AuthorId = request.AuthorId,
                  Content = request.Content,
                  RefProblemId = request.RefProblemId,
                  Attachments = Array.Empty<string>(),
                  Status = DiscussionIssueStatus.OPEN,
                  ViewCount = 0,
                  Comments = new List<Comment>()
            };
            var created = await _repository.CreateAsync(issue);
            return created == null ? null : _discussionIssueMapper.ToDetailResponse(created);
      }

      public async Task<DiscussionIssueDetailResponse?> WriteCommentAsync(WriteCommentRequest request)
      {
            var issue = await _repository.FindByIdAsync(request.IssueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", request.IssueId);
                  return null;
            }
            var comment = new Comment
            {
                  Id = Guid.NewGuid().ToString(),
                  IssueId = request.IssueId,
                  AuthorId = request.AuthorId,
                  Content = request.Content,
                  Attachments = Array.Empty<string>(),
                  UpVoteCount = 0,
                  Replies = new List<Comment>(),
                  IsDeleted = false,
                  CreatedDate = DateTime.UtcNow,
                  UpdatedDate = DateTime.UtcNow
            };
            issue.Comments.Add(comment);
            issue.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : _discussionIssueMapper.ToDetailResponse(updated);
      }

      public async Task<DiscussionIssueDetailResponse?> ReplyCommentAsync(ReplyCommentRequest request)
      {
            var issue = await _repository.FindByIdAsync(request.IssueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", request.IssueId);
                  return null;
            }
            var parent = FindCommentById(issue.Comments, request.ParentCommentId);
            if (parent == null)
            {
                  _logger.LogWarning("Parent comment not found: {CommentId}", request.ParentCommentId);
                  return null;
            }
            var reply = new Comment
            {
                  Id = Guid.NewGuid().ToString(),
                  IssueId = request.IssueId,
                  AuthorId = request.AuthorId,
                  Content = request.Content,
                  Attachments = Array.Empty<string>(),
                  UpVoteCount = 0,
                  Replies = new List<Comment>(),
                  IsDeleted = false,
                  CreatedDate = DateTime.UtcNow,
                  UpdatedDate = DateTime.UtcNow
            };
            parent.Replies.Add(reply);
            issue.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : _discussionIssueMapper.ToDetailResponse(updated);
      }

      public async Task<DiscussionIssueDetailResponse?> UpvoteCommentAsync(UpvoteCommentRequest request)
      {
            var issue = await _repository.FindByIdAsync(request.IssueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", request.IssueId);
                  return null;
            }
            var comment = FindCommentById(issue.Comments, request.CommentId);
            if (comment == null)
            {
                  _logger.LogWarning("Comment not found: {CommentId}", request.CommentId);
                  return null;
            }
            comment.UpVoteCount++;
            comment.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : _discussionIssueMapper.ToDetailResponse(updated);
      }

      public async Task<DiscussionIssueDetailResponse?> ChangeStatusAsync(ChangeDiscussionStatusRequest request)
      {
            var issue = await _repository.FindByIdAsync(request.IssueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", request.IssueId);
                  return null;
            }
            issue.Status = request.Status;
            issue.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : _discussionIssueMapper.ToDetailResponse(updated);
      }

      public async Task<bool> SoftDeleteAsync(string issueId)
      {
            var issue = await _repository.FindByIdAsync(issueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", issueId);
                  return false;
            }
            await _repository.SoftDeleteAsync(issueId);
            return true;
      }

      private Comment? FindCommentById(IList<Comment> comments, string commentId)
      {
            foreach (var c in comments)
            {
                  if (c.Id == commentId) return c;
                  var found = FindCommentById(c.Replies, commentId);
                  if (found != null) return found;
            }
            return null;
      }
}
