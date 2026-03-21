using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Question;

namespace AcasService.Application.Queries.Question
{
    public interface IQuestionQuery
    {
        Task<QuestionResponse> GetQuestionByIdAsync(string questionId);
        Task<List<QuestionResponse>> GetAllQuestionsAsync(bool includeDeleted = false);
    }

    public class QuestionQuery : IQuestionQuery
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly QuestionMapper _questionMapper;
        private readonly ILogger<QuestionQuery> _logger;

        public QuestionQuery(
            IQuestionRepository questionRepository,
            QuestionMapper questionMapper,
            ILogger<QuestionQuery> logger)
        {
            _questionRepository = questionRepository;
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

            return _questionMapper.ToQuestionResponse(question);
        }

        public async Task<List<QuestionResponse>> GetAllQuestionsAsync(bool includeDeleted = false)
        {
            var questions = await _questionRepository.FindAllAsync();

            if (!includeDeleted)
            {
                questions = questions.Where(x => !x.IsDeleted).ToList();
            }

            return questions.Select(_questionMapper.ToQuestionResponse).ToList();
        }
    }
}
