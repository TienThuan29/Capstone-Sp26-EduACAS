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
        
        //Dùng cho việc chuẩn hóa và so sánh text answer của câu hỏi dạng Essay
        public static string NormalizeSingleChoiceTextAnswer(string? answer)
        {
            return Utils.TextAnswerComparer.NormalizeSingleChoice(answer);
        }

        public static string NormalizeMultipleChoiceTextAnswer(string? answer)
        {
            return Utils.TextAnswerComparer.NormalizeMultipleChoice(answer);
        }

        public static bool CompareTextAnswer(Models.QuestionType questionType, string? expectedAnswer, string? submittedAnswer)
        {
            return Utils.TextAnswerComparer.CompareByQuestionType(questionType, expectedAnswer, submittedAnswer);
        }
    }
}
