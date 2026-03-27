using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Quiz;

namespace AcasService.Application.Queries.Quiz
{
    public interface IQuizQuery
    {
        Task<QuizResponse> GetQuizByIdAsync(string quizId);
        Task<List<QuizResponse>> GetAllQuizzesAsync(bool includeDeleted = false);
        Task<PagedResult<QuizResponse>> GetPagedQuizzesAsync(
            int pageIndex = 1,
            int pageSize = 10,
            bool includeDeleted = false,
            string? searchTerm = null,
            string? subjectId = null);
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

        public async Task<PagedResult<QuizResponse>> GetPagedQuizzesAsync(
            int pageIndex = 1,
            int pageSize = 10,
            bool includeDeleted = false,
            string? searchTerm = null,
            string? subjectId = null)
        {
            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var quizzes = await _quizRepository.FindAllAsync();

            if (!includeDeleted)
            {
                quizzes = quizzes.Where(x => !x.IsDeleted).ToList();
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var keyword = searchTerm.Trim().ToLowerInvariant();
                quizzes = quizzes.Where(x => x.Title.ToLowerInvariant().Contains(keyword)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(subjectId))
            {
                quizzes = quizzes.Where(x => x.SubjectId == subjectId).ToList();
            }

            quizzes = quizzes.OrderByDescending(x => x.UpdatedAt).ToList();

            var totalCount = quizzes.Count;
            var items = quizzes
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .Select(_quizMapper.ToQuizResponse)
                .ToList();

            return new PagedResult<QuizResponse>(items, totalCount, pageIndex, pageSize);
        }
    }
}
