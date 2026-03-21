namespace AcasService.Application.Commands.Quiz
{
    public interface IQuizCommand
    {
        // TODO: Define quiz command methods
    }

    public class QuizCommand : IQuizCommand
    {
        private readonly ILogger<QuizCommand> _logger;

        public QuizCommand(ILogger<QuizCommand> logger)
        {
            _logger = logger;
        }

        // TODO: Implement quiz command methods
    }
}
