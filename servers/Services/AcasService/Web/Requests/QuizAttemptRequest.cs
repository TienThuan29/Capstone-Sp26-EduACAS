using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class StartQuizAttemptRequest
    {
        [Required(ErrorMessage = "ClassroomQuiz ID is required")]
        public string ClassroomQuizId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Student ID is required")]
        public string StudentId { get; set; } = string.Empty;

        public string Passcode { get; set; } = string.Empty;
    }

    public class SubmitQuizAttemptRequest
    {
        [Required(ErrorMessage = "Attempt ID is required")]
        public string AttemptId { get; set; } = string.Empty;
    }

    public class UpdateQuizAnswerRequest
    {
        public string QuestionId { get; set; } = string.Empty;
        public string? SelectedOptionId { get; set; }
        public string? TextAnswer { get; set; }
    }
}
