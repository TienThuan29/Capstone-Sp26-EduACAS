namespace AcasService.Application.Commands.StudentAnswer
{
    public interface IStudentAnswerCommand
    {
        // TODO: Define student answer command methods
    }

    public class StudentAnswerCommand : IStudentAnswerCommand
    {
        private readonly ILogger<StudentAnswerCommand> _logger;

        public StudentAnswerCommand(ILogger<StudentAnswerCommand> logger)
        {
            _logger = logger;
        }

        // TODO: Implement student answer command methods
    }
}
