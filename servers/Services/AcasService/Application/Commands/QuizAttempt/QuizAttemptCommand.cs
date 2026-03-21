namespace AcasService.Application.Commands.QuizAttempt
{
    public interface IQuizAttemptCommand
    {
        // TODO: Define quiz attempt command methods
    }

    public class QuizAttemptCommand : IQuizAttemptCommand
    {
        private readonly ILogger<QuizAttemptCommand> _logger;

        public QuizAttemptCommand(ILogger<QuizAttemptCommand> logger)
        {
            _logger = logger;
        }

        // TODO: Implement quiz attempt command methods
    }
}
