using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.QuizAttempt;

namespace AcasService.Application.Queries.QuizAttempt
{
    public interface IQuizAttemptQuery
    {
        Task<QuizAttemptResponse> GetByIdAsync(string id);
        Task<List<QuizAttemptResponse>> GetByStudentIdAsync(string studentId);
    }

    public class QuizAttemptQuery : IQuizAttemptQuery
    {
        private readonly IQuizAttemptRepository _quizAttemptRepository;
        private readonly QuizAttemptMapper _quizAttemptMapper;
        private readonly ILogger<QuizAttemptQuery> _logger;

        public QuizAttemptQuery(
            IQuizAttemptRepository quizAttemptRepository,
            QuizAttemptMapper quizAttemptMapper,
            ILogger<QuizAttemptQuery> logger)
        {
            _quizAttemptRepository = quizAttemptRepository;
            _quizAttemptMapper = quizAttemptMapper;
            _logger = logger;
        }

        public async Task<QuizAttemptResponse> GetByIdAsync(string id)
        {
            var attempt = await _quizAttemptRepository.FindByIdAsync(id);
            if (attempt == null)
            {
                _logger.LogWarning("Quiz attempt not found with id {Id}", id);
                throw new KeyNotFoundException($"Quiz attempt with id {id} not found");
            }

            return _quizAttemptMapper.ToQuizAttemptResponse(attempt);
        }

        public async Task<List<QuizAttemptResponse>> GetByStudentIdAsync(string studentId)
        {
            var attempts = await _quizAttemptRepository.FindByStudentIdAsync(studentId);
            return attempts
                .OrderByDescending(x => x.StartTime)
                .Select(_quizAttemptMapper.ToQuizAttemptResponse)
                .ToList();
        }
    }
}
