using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateQuizRequest
    {
        [Required(ErrorMessage = "Subject ID is required")]
        public string SubjectId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; } = string.Empty;

        public int Duration { get; set; }

        [Required(ErrorMessage = "CreatedBy is required")]
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateQuizRequest
    {
        public string? Title { get; set; }

        public int? Duration { get; set; }
    }
}
