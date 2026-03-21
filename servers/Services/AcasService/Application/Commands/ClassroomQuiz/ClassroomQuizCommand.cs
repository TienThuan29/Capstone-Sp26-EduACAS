namespace AcasService.Application.Commands.ClassroomQuiz
{
    public interface IClassroomQuizCommand
    {
        // TODO: Define classroom quiz command methods
    }

    public class ClassroomQuizCommand : IClassroomQuizCommand
    {
        private readonly ILogger<ClassroomQuizCommand> _logger;

        public ClassroomQuizCommand(ILogger<ClassroomQuizCommand> logger)
        {
            _logger = logger;
        }

        // TODO: Implement classroom quiz command methods
    }
}
