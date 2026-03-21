namespace AcasService.Application.Commands.Question
{
    public interface IQuestionCommand
    {
        // TODO: Define question command methods
    }

    public class QuestionCommand : IQuestionCommand
    {
        private readonly ILogger<QuestionCommand> _logger;

        public QuestionCommand(ILogger<QuestionCommand> logger)
        {
            _logger = logger;
        }

        // TODO: Implement question command methods
    }
}
