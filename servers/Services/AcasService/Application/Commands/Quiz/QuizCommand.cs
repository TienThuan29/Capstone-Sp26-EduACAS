using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Quiz;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Quiz
{
    public interface IQuizCommand
    {
        Task<QuizResponse> CreateQuizAsync(CreateQuizRequest request);
        Task<QuizResponse> UpdateQuizAsync(string quizId, UpdateQuizRequest request);
        Task<QuizResponse> SoftDeleteQuizAsync(string quizId);
        Task<QuizResponse> RestoreQuizAsync(string quizId);
        Task<QuizResponse> AssignQuestionsAsync(string quizId, AssignQuizQuestionsRequest request);
        Task<QuizResponse> DeleteQuizAsync(string quizId);
    }

    public class QuizCommand : IQuizCommand
    {
        private readonly IQuizRepository _quizRepository;
        private readonly QuizMapper _quizMapper;
        private readonly ILogger<QuizCommand> _logger;

        public QuizCommand(
            IQuizRepository quizRepository,
            QuizMapper quizMapper,
            ILogger<QuizCommand> logger)
        {
            _quizRepository = quizRepository;
            _quizMapper = quizMapper;
            _logger = logger;
        }

        public async Task<QuizResponse> CreateQuizAsync(CreateQuizRequest request)
        {
            var now = DateTime.UtcNow;
            var newQuiz = new Models.Quiz
            {
                Id = Guid.NewGuid().ToString(),
                SubjectId = request.SubjectId,
                Title = request.Title,
                Duration = request.Duration,
                TotalQuestions = 0,
                IsDeleted = false,
                CreatedBy = request.CreatedBy,
                CreatedAt = now,
                UpdatedAt = now,
                Questions = new List<Models.QuizQuestion>()
            };

            var created = await _quizRepository.CreateAsync(newQuiz);
            if (created == null)
            {
                throw new Exception("Failed to create quiz");
            }

            return _quizMapper.ToQuizResponse(created);
        }

        public async Task<QuizResponse> UpdateQuizAsync(string quizId, UpdateQuizRequest request)
        {
            var existing = await _quizRepository.FindByIdAsync(quizId);
            if (existing == null || existing.IsDeleted)
            {
                throw new KeyNotFoundException($"Quiz with id {quizId} not found");
            }

            if (!string.IsNullOrWhiteSpace(request.Title))
            {
                existing.Title = request.Title;
            }

            if (request.Duration.HasValue)
            {
                existing.Duration = request.Duration.Value;
            }

            existing.UpdatedAt = DateTime.UtcNow;

            var updated = await _quizRepository.UpdateAsync(existing);
            if (updated == null)
            {
                throw new Exception("Failed to update quiz");
            }

            return _quizMapper.ToQuizResponse(updated);
        }

        public async Task<QuizResponse> SoftDeleteQuizAsync(string quizId)
        {
            var existing = await _quizRepository.FindByIdAsync(quizId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Quiz with id {quizId} not found");
            }

            await _quizRepository.SoftDeleteAsync(quizId);
            existing.IsDeleted = true;
            existing.UpdatedAt = DateTime.UtcNow;

            return _quizMapper.ToQuizResponse(existing);
        }

        public async Task<QuizResponse> RestoreQuizAsync(string quizId)
        {
            var existing = await _quizRepository.FindByIdAsync(quizId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Quiz with id {quizId} not found");
            }

            existing.IsDeleted = false;
            existing.UpdatedAt = DateTime.UtcNow;

            var updated = await _quizRepository.UpdateAsync(existing);
            if (updated == null)
            {
                throw new Exception("Failed to restore quiz");
            }

            return _quizMapper.ToQuizResponse(updated);
        }

        public async Task<QuizResponse> AssignQuestionsAsync(string quizId, AssignQuizQuestionsRequest request)
        {
            var existing = await _quizRepository.FindByIdAsync(quizId);
            if (existing == null || existing.IsDeleted)
            {
                throw new KeyNotFoundException($"Quiz with id {quizId} not found");
            }

            if (request.Questions.Count > 0)
            {
                var totalMarks = request.Questions.Sum(q => q.Marks);
                if (Math.Abs(totalMarks - 10.0) > 0.001)
                {
                    throw new ArgumentException($"Total marks of all questions must equal 10. Current total: {totalMarks}");
                }
            }

            var normalizedQuestions = request.Questions
                .GroupBy(x => x.QuestionId)
                .Select(g => g.First())
                .OrderBy(x => x.DisplayOrder)
                .Select(x => new Models.QuizQuestion
                {
                    QuizId = quizId,
                    QuestionId = x.QuestionId,
                    Marks = x.Marks,
                    DisplayOrder = x.DisplayOrder
                })
                .ToList();

            existing.Questions = normalizedQuestions;
            existing.TotalQuestions = normalizedQuestions.Count;
            existing.UpdatedAt = DateTime.UtcNow;

            var updated = await _quizRepository.UpdateAsync(existing);
            if (updated == null)
            {
                throw new Exception("Failed to assign questions to quiz");
            }

            return _quizMapper.ToQuizResponse(updated);
        }

        public async Task<QuizResponse> DeleteQuizAsync(string quizId)
        {
            var existing = await _quizRepository.FindByIdAsync(quizId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Quiz with id {quizId} not found");
            }

            await _quizRepository.DeleteAsync(quizId);
            return _quizMapper.ToQuizResponse(existing);
        }
    }
}
