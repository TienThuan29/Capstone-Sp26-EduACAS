using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.AnswerOption;
using AcasService.Repositories.Question;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Question
{
    public interface IQuestionCommand
    {
        Task<QuestionResponse> CreateQuestionAsync(CreateQuestionRequest request);
        Task<QuestionResponse> UpdateQuestionAsync(string questionId, UpdateQuestionRequest request);
        Task<QuestionResponse> SoftDeleteQuestionAsync(string questionId);
        Task<QuestionResponse> RestoreQuestionAsync(string questionId);
        Task<QuestionResponse> DeleteQuestionAsync(string questionId);
    }

    public class QuestionCommand : IQuestionCommand
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly IAnswerOptionRepository _answerOptionRepository;
        private readonly QuestionMapper _questionMapper;
        private readonly ILogger<QuestionCommand> _logger;

        public QuestionCommand(
            IQuestionRepository questionRepository,
            IAnswerOptionRepository answerOptionRepository,
            QuestionMapper questionMapper,
            ILogger<QuestionCommand> logger)
        {
            _questionRepository = questionRepository;
            _answerOptionRepository = answerOptionRepository;
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
                TextAnswer = request.TextAnswer
            };

            NormalizeAnswerByType(newQuestion);

            var created = await _questionRepository.CreateAsync(newQuestion);
            if (created == null)
            {
                throw new Exception("Failed to create question");
            }

            if (newQuestion.Type != Models.QuestionType.ESSAY)
            {
                var answerOptions = request.AnswerOptions.Select(option => new Models.AnswerOption
                {
                    Id = Guid.NewGuid().ToString(),
                    QuestionId = questionId,
                    Content = option.Content,
                    IsCorrect = option.IsCorrect,
                    CreatedAt = now,
                    UpdatedAt = now
                }).ToList();

                created.AnswerOptions = await _answerOptionRepository.CreateBatchAsync(answerOptions);
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

            existing.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(existing.Id);

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

            if (request.AnswerOptions != null && existing.Type != Models.QuestionType.ESSAY)
            {
                await _answerOptionRepository.DeleteByQuestionIdAsync(existing.Id);

                var optionNow = DateTime.UtcNow;
                var refreshedOptions = request.AnswerOptions.Select(option => new Models.AnswerOption
                {
                    Id = Guid.NewGuid().ToString(),
                    QuestionId = existing.Id,
                    Content = option.Content,
                    IsCorrect = option.IsCorrect,
                    CreatedAt = optionNow,
                    UpdatedAt = optionNow
                }).ToList();

                existing.AnswerOptions = await _answerOptionRepository.CreateBatchAsync(refreshedOptions);
            }

            if (request.TextAnswer != null)
            {
                existing.TextAnswer = request.TextAnswer;
            }

            NormalizeAnswerByType(existing);
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
            existing.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(existing.Id);

            return _questionMapper.ToQuestionResponse(existing);
        }

        public async Task<QuestionResponse> RestoreQuestionAsync(string questionId)
        {
            var existing = await _questionRepository.FindByIdAsync(questionId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Question with id {questionId} not found");
            }

            existing.IsDeleted = false;
            existing.UpdatedAt = DateTime.UtcNow;

            var updated = await _questionRepository.UpdateAsync(existing);
            if (updated == null)
            {
                throw new Exception("Failed to restore question");
            }

            updated.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(updated.Id);

            return _questionMapper.ToQuestionResponse(updated);
        }

        public async Task<QuestionResponse> DeleteQuestionAsync(string questionId)
        {
            var existing = await _questionRepository.FindByIdAsync(questionId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Question with id {questionId} not found");
            }

            existing.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(existing.Id);
            await _questionRepository.DeleteAsync(questionId);
            await _answerOptionRepository.DeleteByQuestionIdAsync(questionId);
            return _questionMapper.ToQuestionResponse(existing);
        }

        private static void NormalizeAnswerByType(Models.Question question)
        {
            if (question.Type == Models.QuestionType.ESSAY)
            {
                question.AnswerOptions = new List<Models.AnswerOption>();
                return;
            }

            question.TextAnswer = null;
        }
    }
}
