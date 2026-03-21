namespace AcasService.Application.Queries.Question
{
    public interface IQuestionQuery
    {
        // TODO: Define question query methods
    }

    public class QuestionQuery : IQuestionQuery
    {
        private readonly ILogger<QuestionQuery> _logger;

        public QuestionQuery(ILogger<QuestionQuery> logger)
        {
            _logger = logger;
        }

        // TODO: Implement question query methods
    }
}
