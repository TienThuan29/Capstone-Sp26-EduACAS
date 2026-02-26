using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Comment;
using AcasService.Repositories.DiscussionIssue;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Comment
{
    public interface ICommentCommand
    {
        Task<CommentResponse> CreateAsync(CreateCommentRequest request);
        Task<CommentResponse> UpdateAsync(string commentId, UpdateCommentRequest request);
        Task<CommentResponse> SoftDeleteAsync(string commentId);
        Task<CommentResponse> DeleteAsync(string commentId);
    }

    public class CommentCommand : ICommentCommand
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IDiscussionIssueRepository _discussionIssueRepository;
        private readonly CommentMapper _mapper;
        private readonly ILogger<CommentCommand> _logger;

        public CommentCommand(
            ICommentRepository commentRepository,
            IDiscussionIssueRepository discussionIssueRepository,
            CommentMapper mapper,
            ILogger<CommentCommand> logger)
        {
            _commentRepository = commentRepository;
            _discussionIssueRepository = discussionIssueRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<CommentResponse> CreateAsync(CreateCommentRequest request)
        {
            // Verify the discussion issue exists
            var issue = await _discussionIssueRepository.FindByIdAsync(request.DiscussionIssueId);
            if (issue == null)
            {
                _logger.LogError("Discussion issue not found with ID: {IssueId}", request.DiscussionIssueId);
                throw new KeyNotFoundException("Discussion issue not found");
            }

            var now = DateTime.UtcNow;
            var comment = new Models.Comment
            {
                Id = Guid.NewGuid().ToString(),
                DiscussionIssueId = request.DiscussionIssueId,
                AuthorId = request.AuthorId,
                AuthorName = request.AuthorName,
                Content = request.Content,
                ImagesName = request.ImagesName,
                FilesName = request.FilesName,
                IsDeleted = false,
                CreatedDate = now,
                UpdatedDate = now
            };

            var created = await _commentRepository.CreateAsync(comment);
            if (created == null)
            {
                _logger.LogError("Failed to create comment");
                throw new Exception("Failed to create comment");
            }

            return _mapper.ToResponse(created);
        }

        public async Task<CommentResponse> UpdateAsync(string commentId, UpdateCommentRequest request)
        {
            var existing = await _commentRepository.FindByIdAsync(commentId);
            if (existing == null)
            {
                _logger.LogError("Comment not found with ID: {CommentId}", commentId);
                throw new KeyNotFoundException("Comment not found");
            }

            existing.Content = request.Content;
            existing.ImagesName = request.ImagesName;
            existing.FilesName = request.FilesName;
            existing.UpdatedDate = DateTime.UtcNow;

            var updated = await _commentRepository.UpdateAsync(existing);
            if (updated == null)
            {
                _logger.LogError("Failed to update comment");
                throw new Exception("Failed to update comment");
            }

            return _mapper.ToResponse(updated);
        }

        public async Task<CommentResponse> SoftDeleteAsync(string commentId)
        {
            var existing = await _commentRepository.FindByIdAsync(commentId);
            if (existing == null)
            {
                _logger.LogError("Comment not found with ID: {CommentId}", commentId);
                throw new KeyNotFoundException("Comment not found");
            }

            await _commentRepository.SoftDeleteAsync(commentId);
            existing.IsDeleted = true;
            return _mapper.ToResponse(existing);
        }

        public async Task<CommentResponse> DeleteAsync(string commentId)
        {
            var existing = await _commentRepository.FindByIdAsync(commentId);
            if (existing == null)
            {
                _logger.LogError("Comment not found with ID: {CommentId}", commentId);
                throw new KeyNotFoundException("Comment not found");
            }

            await _commentRepository.DeleteAsync(commentId);
            return _mapper.ToResponse(existing);
        }
    }
}
