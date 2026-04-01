using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class SubmitStudentAnswerRequest
    {
        [Required(ErrorMessage = "Attempt ID is required")]
        public string AttemptId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Question ID is required")]
        public string QuestionId { get; set; } = string.Empty;

        public string? AnswerOptionId { get; set; }

        public string? TextAnswer { get; set; }
    }

    public class BulkSubmitStudentAnswerRequest
    {
        [Required(ErrorMessage = "Answers are required")]
        [MinLength(1, ErrorMessage = "At least one answer is required")]
        public List<SubmitStudentAnswerRequest> Answers { get; set; } = new();
    }
}
