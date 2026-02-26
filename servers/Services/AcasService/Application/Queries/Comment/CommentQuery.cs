using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Comment;

namespace AcasService.Application.Queries.Comment
{
    public interface ICommentQuery
    {
        Task<CommentResponse> GetByIdAsync(string commentId);
        Task<List<CommentResponse>> GetByDiscussionIssueIdAsync(string discussionIssueId);
    }

    public class CommentQuery : ICommentQuery
    {
        private readonly ICommentRepository _commentRepository;
        private readonly CommentMapper _mapper;
        private readonly ILogger<CommentQuery> _logger;

        public CommentQuery(
            ICommentRepository commentRepository,
            CommentMapper mapper,
            ILogger<CommentQuery> logger)
        {
            _commentRepository = commentRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<CommentResponse> GetByIdAsync(string commentId)
        {
            try
            {
                var comment = await _commentRepository.FindByIdAsync(commentId);
                if (comment == null)
                {
                    _logger.LogError("Comment not found with ID: {CommentId}", commentId);
                    throw new KeyNotFoundException("Comment not found");
                }

                return _mapper.ToResponse(comment);
            }
            catch (Exception ex) when (ex is not KeyNotFoundException)
            {
                _logger.LogError(ex, "Error getting comment by ID: {CommentId}", commentId);
                throw;
            }
        }

        public async Task<List<CommentResponse>> GetByDiscussionIssueIdAsync(string discussionIssueId)
        {
            try
            {
                var comments = await _commentRepository.FindByDiscussionIssueIdAsync(discussionIssueId);
                return comments.Select(c => _mapper.ToResponse(c)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments for discussion issue: {IssueId}", discussionIssueId);
                throw;
            }
        }
    }
}
