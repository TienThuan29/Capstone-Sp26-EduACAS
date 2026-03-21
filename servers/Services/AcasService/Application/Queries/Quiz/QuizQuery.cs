namespace AcasService.Application.Queries.Quiz
{
    public interface IQuizQuery
    {
        // TODO: Define quiz query methods
    }

    public class QuizQuery : IQuizQuery
    {
        private readonly ILogger<QuizQuery> _logger;

        public QuizQuery(ILogger<QuizQuery> logger)
        {
            _logger = logger;
        }

        // TODO: Implement quiz query methods
    }
}
