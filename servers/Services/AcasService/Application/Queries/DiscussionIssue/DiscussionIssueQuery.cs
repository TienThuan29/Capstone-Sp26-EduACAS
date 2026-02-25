using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Comment;
using AcasService.Repositories.DiscussionIssue;

namespace AcasService.Application.Queries.DiscussionIssue
{
    public interface IDiscussionIssueQuery
    {
        Task<DiscussionIssueResponse> GetByIdAsync(string issueId);
        Task<List<DiscussionIssueResponse>> GetByClassroomIdAsync(string classroomId);
        Task<List<DiscussionIssueResponse>> GetAllAsync();
    }

    public class DiscussionIssueQuery : IDiscussionIssueQuery
    {
        private readonly IDiscussionIssueRepository _discussionIssueRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly DiscussionIssueMapper _mapper;
        private readonly ILogger<DiscussionIssueQuery> _logger;

        public DiscussionIssueQuery(
            IDiscussionIssueRepository discussionIssueRepository,
            ICommentRepository commentRepository,
            DiscussionIssueMapper mapper,
            ILogger<DiscussionIssueQuery> logger)
        {
            _discussionIssueRepository = discussionIssueRepository;
            _commentRepository = commentRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<DiscussionIssueResponse> GetByIdAsync(string issueId)
        {
            try
            {
                var issue = await _discussionIssueRepository.FindByIdAsync(issueId);
                if (issue == null)
                {
                    _logger.LogError("Discussion issue not found with ID: {IssueId}", issueId);
                    throw new KeyNotFoundException("Discussion issue not found");
                }

                var commentCount = await _commentRepository.CountByDiscussionIssueIdAsync(issueId);
                return _mapper.ToResponse(issue, commentCount);
            }
            catch (Exception ex) when (ex is not KeyNotFoundException)
            {
                _logger.LogError(ex, "Error getting discussion issue by ID: {IssueId}", issueId);
                throw;
            }
        }

        public async Task<List<DiscussionIssueResponse>> GetByClassroomIdAsync(string classroomId)
        {
            try
            {
                var issues = await _discussionIssueRepository.FindByClassroomIdAsync(classroomId);

                var responses = new List<DiscussionIssueResponse>();
                foreach (var issue in issues)
                {
                    var commentCount = await _commentRepository.CountByDiscussionIssueIdAsync(issue.Id);
                    responses.Add(_mapper.ToResponse(issue, commentCount));
                }

                return responses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting discussion issues for classroom: {ClassroomId}", classroomId);
                throw;
            }
        }

        public async Task<List<DiscussionIssueResponse>> GetAllAsync()
        {
            try
            {
                var issues = await _discussionIssueRepository.FindAllAsync();

                var responses = new List<DiscussionIssueResponse>();
                foreach (var issue in issues)
                {
                    var commentCount = await _commentRepository.CountByDiscussionIssueIdAsync(issue.Id);
                    responses.Add(_mapper.ToResponse(issue, commentCount));
                }

                return responses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all discussion issues");
                throw;
            }
        }
    }
}
