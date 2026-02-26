using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.DiscussionIssue;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.DiscussionIssue
{
    public interface IDiscussionIssueCommand
    {
        Task<DiscussionIssueResponse> CreateAsync(CreateDiscussionIssueRequest request);
        Task<DiscussionIssueResponse> UpdateAsync(string issueId, UpdateDiscussionIssueRequest request);
        Task<DiscussionIssueResponse> SoftDeleteAsync(string issueId);
        Task<DiscussionIssueResponse> DeleteAsync(string issueId);
    }

    public class DiscussionIssueCommand : IDiscussionIssueCommand
    {
        private readonly IDiscussionIssueRepository _repository;
        private readonly DiscussionIssueMapper _mapper;
        private readonly ILogger<DiscussionIssueCommand> _logger;

        public DiscussionIssueCommand(
            IDiscussionIssueRepository repository,
            DiscussionIssueMapper mapper,
            ILogger<DiscussionIssueCommand> logger)
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<DiscussionIssueResponse> CreateAsync(CreateDiscussionIssueRequest request)
        {
            var now = DateTime.UtcNow;
            var issue = new Models.DiscussionIssue
            {
                Id = Guid.NewGuid().ToString(),
                ClassroomId = request.ClassroomId,
                Title = request.Title,
                AuthorId = request.AuthorId,
                AuthorName = request.AuthorName,
                Content = request.Content,
                ImagesName = request.ImagesName,
                FilesName = request.FilesName,
                IsDeleted = false,
                CreatedDate = now,
                UpdatedDate = now
            };

            var created = await _repository.CreateAsync(issue);
            if (created == null)
            {
                _logger.LogError("Failed to create discussion issue");
                throw new Exception("Failed to create discussion issue");
            }

            return _mapper.ToResponse(created);
        }

        public async Task<DiscussionIssueResponse> UpdateAsync(string issueId, UpdateDiscussionIssueRequest request)
        {
            var existing = await _repository.FindByIdAsync(issueId);
            if (existing == null)
            {
                _logger.LogError("Discussion issue not found with ID: {IssueId}", issueId);
                throw new KeyNotFoundException("Discussion issue not found");
            }

            existing.Title = request.Title;
            existing.Content = request.Content;
            existing.ImagesName = request.ImagesName;
            existing.FilesName = request.FilesName;
            existing.UpdatedDate = DateTime.UtcNow;

            var updated = await _repository.UpdateAsync(existing);
            if (updated == null)
            {
                _logger.LogError("Failed to update discussion issue");
                throw new Exception("Failed to update discussion issue");
            }

            return _mapper.ToResponse(updated);
        }

        public async Task<DiscussionIssueResponse> SoftDeleteAsync(string issueId)
        {
            var existing = await _repository.FindByIdAsync(issueId);
            if (existing == null)
            {
                _logger.LogError("Discussion issue not found with ID: {IssueId}", issueId);
                throw new KeyNotFoundException("Discussion issue not found");
            }

            await _repository.SoftDeleteAsync(issueId);
            existing.IsDeleted = true;
            return _mapper.ToResponse(existing);
        }

        public async Task<DiscussionIssueResponse> DeleteAsync(string issueId)
        {
            var existing = await _repository.FindByIdAsync(issueId);
            if (existing == null)
            {
                _logger.LogError("Discussion issue not found with ID: {IssueId}", issueId);
                throw new KeyNotFoundException("Discussion issue not found");
            }

            await _repository.DeleteAsync(issueId);
            return _mapper.ToResponse(existing);
        }
    }
}
