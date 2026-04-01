using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.AnswerOption;
using AcasService.Repositories.Question;

namespace AcasService.Application.Queries.Question
{
    public interface IQuestionQuery
    {
        Task<QuestionResponse> GetQuestionByIdAsync(string questionId);
        Task<List<QuestionResponse>> GetAllQuestionsAsync(bool includeDeleted = false);
        Task<PagedResult<QuestionResponse>> GetPagedQuestionsAsync(
            int pageIndex = 1,
            int pageSize = 10,
            bool includeDeleted = false,
            string? searchTerm = null,
            string? type = null);
    }

    public class QuestionQuery : IQuestionQuery
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly IAnswerOptionRepository _answerOptionRepository;
        private readonly QuestionMapper _questionMapper;
        private readonly ILogger<QuestionQuery> _logger;

        public QuestionQuery(
            IQuestionRepository questionRepository,
            IAnswerOptionRepository answerOptionRepository,
            QuestionMapper questionMapper,
            ILogger<QuestionQuery> logger)
        {
            _questionRepository = questionRepository;
            _answerOptionRepository = answerOptionRepository;
            _questionMapper = questionMapper;
            _logger = logger;
        }

        public async Task<QuestionResponse> GetQuestionByIdAsync(string questionId)
        {
            var question = await _questionRepository.FindByIdAsync(questionId);
            if (question == null || question.IsDeleted)
            {
                _logger.LogWarning("Question not found with id {Id}", questionId);
                throw new KeyNotFoundException($"Question with id {questionId} not found");
            }

            question.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(question.Id);

            return _questionMapper.ToQuestionResponse(question);
        }

        public async Task<List<QuestionResponse>> GetAllQuestionsAsync(bool includeDeleted = false)
        {
            var questions = await _questionRepository.FindAllAsync();

            if (!includeDeleted)
            {
                questions = questions.Where(x => !x.IsDeleted).ToList();
            }

            await HydrateAnswerOptionsAsync(questions);

            return questions.Select(_questionMapper.ToQuestionResponse).ToList();
        }

        public async Task<PagedResult<QuestionResponse>> GetPagedQuestionsAsync(
            int pageIndex = 1,
            int pageSize = 10,
            bool includeDeleted = false,
            string? searchTerm = null,
            string? type = null)
        {
            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var questions = await _questionRepository.FindAllAsync();

            if (!includeDeleted)
            {
                questions = questions.Where(x => !x.IsDeleted).ToList();
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var keyword = searchTerm.Trim().ToLowerInvariant();
                questions = questions.Where(x => x.Content.ToLowerInvariant().Contains(keyword)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<Models.QuestionType>(type, true, out var parsedType))
            {
                questions = questions.Where(x => x.Type == parsedType).ToList();
            }

            questions = questions.OrderByDescending(x => x.UpdatedAt).ToList();

            var totalCount = questions.Count;
            var pagedItems = questions
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            await HydrateAnswerOptionsAsync(pagedItems);

            var items = pagedItems
                .Select(_questionMapper.ToQuestionResponse)
                .ToList();

            return new PagedResult<QuestionResponse>(items, totalCount, pageIndex, pageSize);
        }

        private async Task HydrateAnswerOptionsAsync(List<Models.Question> questions)
        {
            if (questions.Count == 0)
            {
                return;
            }

            var optionMap = await _answerOptionRepository.FindByQuestionIdsAsync(questions.Select(x => x.Id));
            foreach (var question in questions)
            {
                if (optionMap.TryGetValue(question.Id, out var options) && options.Count > 0)
                {
                    question.AnswerOptions = options;
                }
            }
        }
    }
}
