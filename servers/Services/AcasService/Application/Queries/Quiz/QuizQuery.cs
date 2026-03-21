using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Quiz;

namespace AcasService.Application.Queries.Quiz
{
    public interface IQuizQuery
    {
        Task<QuizResponse> GetQuizByIdAsync(string quizId);
        Task<List<QuizResponse>> GetAllQuizzesAsync(bool includeDeleted = false);
    }

    public class QuizQuery : IQuizQuery
    {
        private readonly IQuizRepository _quizRepository;
        private readonly QuizMapper _quizMapper;
        private readonly ILogger<QuizQuery> _logger;

        public QuizQuery(
            IQuizRepository quizRepository,
            QuizMapper quizMapper,
            ILogger<QuizQuery> logger)
        {
            _quizRepository = quizRepository;
            _quizMapper = quizMapper;
            _logger = logger;
        }

        public async Task<QuizResponse> GetQuizByIdAsync(string quizId)
        {
            var quiz = await _quizRepository.FindByIdAsync(quizId);
            if (quiz == null || quiz.IsDeleted)
            {
                _logger.LogWarning("Quiz not found with id {Id}", quizId);
                throw new KeyNotFoundException($"Quiz with id {quizId} not found");
            }

            return _quizMapper.ToQuizResponse(quiz);
        }

        public async Task<List<QuizResponse>> GetAllQuizzesAsync(bool includeDeleted = false)
        {
            var quizzes = await _quizRepository.FindAllAsync();

            if (!includeDeleted)
            {
                quizzes = quizzes.Where(x => !x.IsDeleted).ToList();
            }

            return quizzes.Select(_quizMapper.ToQuizResponse).ToList();
        }
    }
}
