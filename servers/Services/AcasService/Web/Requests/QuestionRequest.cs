using System.ComponentModel.DataAnnotations;
using AcasService.Models;

namespace AcasService.Web.Requests
{
    public class CreateQuestionRequest
    {
        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        [Required(ErrorMessage = "Question type is required")]
        public QuestionType Type { get; set; }

        [Required(ErrorMessage = "CreatedBy is required")]
        public string CreatedBy { get; set; } = string.Empty;

        public List<CreateAnswerOptionRequest> AnswerOptions { get; set; } = new();
    }

    public class CreateAnswerOptionRequest
    {
        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; } = string.Empty;

        public bool IsCorrect { get; set; }
    }

    public class UpdateQuestionRequest
    {
        public string? Content { get; set; }

        public string? ImageUrl { get; set; }

        public QuestionType? Type { get; set; }

        public List<CreateAnswerOptionRequest>? AnswerOptions { get; set; }
    }
}
