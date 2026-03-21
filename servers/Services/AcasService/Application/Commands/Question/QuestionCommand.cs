using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Question;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Question
{
    public interface IQuestionCommand
    {
        Task<QuestionResponse> CreateQuestionAsync(CreateQuestionRequest request);
        Task<QuestionResponse> UpdateQuestionAsync(string questionId, UpdateQuestionRequest request);
        Task<QuestionResponse> SoftDeleteQuestionAsync(string questionId);
        Task<QuestionResponse> DeleteQuestionAsync(string questionId);
    }

    public class QuestionCommand : IQuestionCommand
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly QuestionMapper _questionMapper;
        private readonly ILogger<QuestionCommand> _logger;

        public QuestionCommand(
            IQuestionRepository questionRepository,
            QuestionMapper questionMapper,
            ILogger<QuestionCommand> logger)
        {
            _questionRepository = questionRepository;
            _questionMapper = questionMapper;
            _logger = logger;
        }

        public async Task<QuestionResponse> CreateQuestionAsync(CreateQuestionRequest request)
        {
            var now = DateTime.UtcNow;
            var questionId = Guid.NewGuid().ToString();

            var newQuestion = new Models.Question
            {
                Id = questionId,
                Content = request.Content,
                ImageUrl = request.ImageUrl,
                Type = request.Type,
                IsDeleted = false,
                CreatedBy = request.CreatedBy,
                CreatedAt = now,
                UpdatedAt = now,
                AnswerOptions = request.AnswerOptions.Select(option => new Models.AnswerOption
                {
                    Id = Guid.NewGuid().ToString(),
                    QuestionId = questionId,
                    Content = option.Content,
                    IsCorrect = option.IsCorrect,
                    CreatedAt = now,
                    UpdatedAt = now
                }).ToList()
            };

            var created = await _questionRepository.CreateAsync(newQuestion);
            if (created == null)
            {
                throw new Exception("Failed to create question");
            }

            return _questionMapper.ToQuestionResponse(created);
        }

        public async Task<QuestionResponse> UpdateQuestionAsync(string questionId, UpdateQuestionRequest request)
        {
            var existing = await _questionRepository.FindByIdAsync(questionId);
            if (existing == null || existing.IsDeleted)
            {
                throw new KeyNotFoundException($"Question with id {questionId} not found");
            }

            if (!string.IsNullOrWhiteSpace(request.Content))
            {
                existing.Content = request.Content;
            }

            if (request.ImageUrl != null)
            {
                existing.ImageUrl = request.ImageUrl;
            }

            if (request.Type.HasValue)
            {
                existing.Type = request.Type.Value;
            }

            if (request.AnswerOptions != null)
            {
                existing.AnswerOptions = request.AnswerOptions.Select(option => new Models.AnswerOption
                {
                    Id = Guid.NewGuid().ToString(),
                    QuestionId = existing.Id,
                    Content = option.Content,
                    IsCorrect = option.IsCorrect,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }).ToList();
            }

            existing.UpdatedAt = DateTime.UtcNow;

            var updated = await _questionRepository.UpdateAsync(existing);
            if (updated == null)
            {
                throw new Exception("Failed to update question");
            }

            return _questionMapper.ToQuestionResponse(updated);
        }

        public async Task<QuestionResponse> SoftDeleteQuestionAsync(string questionId)
        {
            var existing = await _questionRepository.FindByIdAsync(questionId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Question with id {questionId} not found");
            }

            await _questionRepository.SoftDeleteAsync(questionId);
            existing.IsDeleted = true;
            existing.UpdatedAt = DateTime.UtcNow;

            return _questionMapper.ToQuestionResponse(existing);
        }

        public async Task<QuestionResponse> DeleteQuestionAsync(string questionId)
        {
            var existing = await _questionRepository.FindByIdAsync(questionId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Question with id {questionId} not found");
            }

            await _questionRepository.DeleteAsync(questionId);
            return _questionMapper.ToQuestionResponse(existing);
        }
    }
}
