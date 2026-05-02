using AcasService.Application.Mappers;
using AcasService.Application.Commands.Notification;
using AcasService.Application.Queries.DiscussionIssue;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.DiscussionIssue;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.DiscussionIssue;

public interface IDiscussionIssueCommand
{
      Task<DiscussionIssueDetailResponse?> CreateIssueAsync(CreateDiscussionIssueRequest request);

      Task<DiscussionIssueDetailResponse?> UpdateIssueAsync(string issueId, UpdateDiscussionIssueRequest request);

      Task<DiscussionIssueDetailResponse?> WriteCommentAsync(WriteCommentRequest request);

      Task<DiscussionIssueDetailResponse?> ReplyCommentAsync(ReplyCommentRequest request);

      Task<DiscussionIssueDetailResponse?> UpvoteCommentAsync(UpvoteCommentRequest request);

      Task<DiscussionIssueDetailResponse?> ChangeStatusAsync(ChangeDiscussionStatusRequest request);

      Task<bool> SoftDeleteAsync(string issueId);

      Task<DiscussionIssueDetailResponse?> UpdateCommentAsync(UpdateCommentRequest request);

      Task<DiscussionIssueDetailResponse?> SoftDeleteCommentAsync(SoftDeleteCommentRequest request);
}


public class DiscussionIssueCommand : IDiscussionIssueCommand
{
      private readonly IDiscussionIssueRepository _repository;
      private readonly DiscussionIssueMapper _discussionIssueMapper;
      private readonly IDiscussionIssueQuery _discussionIssueQuery;
      private readonly IBusinessNotificationService _businessNotificationService;
      private readonly Messaging.User.UserRequestProducer _userRequestProducer;
      private readonly ILogger<DiscussionIssueCommand> _logger;

      public DiscussionIssueCommand(
          IDiscussionIssueRepository repository,
          DiscussionIssueMapper discussionIssueMapper,
          IDiscussionIssueQuery discussionIssueQuery,
          IBusinessNotificationService businessNotificationService,
          Messaging.User.UserRequestProducer userRequestProducer,
          ILogger<DiscussionIssueCommand> logger)
      {
            _repository = repository;
            _discussionIssueMapper = discussionIssueMapper;
            _discussionIssueQuery = discussionIssueQuery;
            _businessNotificationService = businessNotificationService;
            _userRequestProducer = userRequestProducer;
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
                  Comments = new List<Models.Comment>()
            };
            var created = await _repository.CreateAsync(issue);

            if (created != null)
            {
                  await _businessNotificationService.NotifyClassroomAsync(
                      created.ClassroomId,
                      NotificationType.NEW_DISCUSSION_ISSUE,
                      "New discussion topic",
                      $"A new discussion topic '{created.Title}' has been posted.",
                      excludeUserId: created.AuthorId,
                      payload: new Dictionary<string, object?>
                      {
                            ["discussionIssueId"] = created.Id,
                            ["classroomId"] = created.ClassroomId,
                            ["authorId"] = created.AuthorId
                      }
                  );
            }

            return created == null ? null : await _discussionIssueQuery.GetByIdAsync(created.Id);
      }

      public async Task<DiscussionIssueDetailResponse?> UpdateIssueAsync(string issueId, UpdateDiscussionIssueRequest request)
      {
            var issue = await _repository.FindByIdAsync(issueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", issueId);
                  return null;
            }
            issue.Title = request.Title;
            issue.Content = request.Content;
            issue.RefProblemId = request.RefProblemId ?? string.Empty;
            issue.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : await _discussionIssueQuery.GetByIdAsync(updated.Id);
      }

      public async Task<DiscussionIssueDetailResponse?> WriteCommentAsync(WriteCommentRequest request)
      {
            var issue = await _repository.FindByIdAsync(request.IssueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", request.IssueId);
                  return null;
            }
            var comment = new Models.Comment
            {
                  Id = Guid.NewGuid().ToString(),
                  IssueId = request.IssueId,
                  AuthorId = request.AuthorId,
                  Content = request.Content,
                  Attachments = Array.Empty<string>(),
                  UpVoteCount = 0,
                  Replies = new List<Models.Comment>(),
                  IsDeleted = false,
                  CreatedDate = DateTime.UtcNow,
                  UpdatedDate = DateTime.UtcNow
            };
            issue.Comments.Add(comment);
            issue.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : await _discussionIssueQuery.GetByIdAsync(updated.Id);
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
            var reply = new Models.Comment
            {
                  Id = Guid.NewGuid().ToString(),
                  IssueId = request.IssueId,
                  AuthorId = request.AuthorId,
                  Content = request.Content,
                  Attachments = Array.Empty<string>(),
                  UpVoteCount = 0,
                  Replies = new List<Models.Comment>(),
                  IsDeleted = false,
                  CreatedDate = DateTime.UtcNow,
                  UpdatedDate = DateTime.UtcNow
            };
            parent.Replies.Add(reply);
            issue.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : await _discussionIssueQuery.GetByIdAsync(updated.Id);
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
            return updated == null ? null : await _discussionIssueQuery.GetByIdAsync(updated.Id);
      }

      public async Task<DiscussionIssueDetailResponse?> ChangeStatusAsync(ChangeDiscussionStatusRequest request)
      {
            var issue = await _repository.FindByIdAsync(request.IssueId);
            if (issue == null)
            {
                  _logger.LogWarning("Discussion issue not found: {IssueId}", request.IssueId);
                  return null;
            }

            var previousStatus = issue.Status;
            issue.Status = request.Status;
            issue.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);

            if (updated != null && previousStatus != request.Status)
            {
                  var participantIds = CollectParticipantIds(issue);
                  if (participantIds.Count > 0)
                  {
                        var statusText = request.Status == DiscussionIssueStatus.CLOSED ? "closed" : "reopened";
                        var title = $"Discussion '{issue.Title}' has been {statusText}";
                        var body = $"The discussion topic '{issue.Title}' has been marked as {statusText} by the lecturer.";

                        await _businessNotificationService.NotifyUsersAsync(
                            participantIds,
                            NotificationType.DISCUSSION_ISSUE_STATUS_CHANGED,
                            title,
                            body,
                            new Dictionary<string, object?>
                            {
                                  ["discussionIssueId"] = issue.Id,
                                  ["classroomId"] = issue.ClassroomId,
                                  ["newStatus"] = request.Status.ToString(),
                                  ["previousStatus"] = previousStatus.ToString()
                            }
                        );
                  }
            }

            return updated == null ? null : await _discussionIssueQuery.GetByIdAsync(updated.Id);
      }

      public async Task<DiscussionIssueDetailResponse?> UpdateCommentAsync(UpdateCommentRequest request)
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
            comment.Content = request.Content;
            comment.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : await _discussionIssueQuery.GetByIdAsync(updated.Id);
      }

      public async Task<DiscussionIssueDetailResponse?> SoftDeleteCommentAsync(SoftDeleteCommentRequest request)
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
            comment.IsDeleted = true;
            comment.UpdatedDate = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(issue);
            return updated == null ? null : await _discussionIssueQuery.GetByIdAsync(updated.Id);
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

      private List<string> CollectParticipantIds(Models.DiscussionIssue issue)
      {
            var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrEmpty(issue.AuthorId)) ids.Add(issue.AuthorId);
            CollectCommentAuthorIds(issue.Comments, ids);
            return ids.ToList();
      }

      private void CollectCommentAuthorIds(IList<Models.Comment> comments, HashSet<string> ids)
      {
            if (comments == null) return;
            foreach (var c in comments)
            {
                  if (!string.IsNullOrEmpty(c.AuthorId)) ids.Add(c.AuthorId);
                  CollectCommentAuthorIds(c.Replies, ids);
            }
      }

      private Models.Comment? FindCommentById(IList<Models.Comment> comments, string commentId)
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
