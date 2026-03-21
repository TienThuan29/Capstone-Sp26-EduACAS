using System.ComponentModel.DataAnnotations;
using AcasService.Models;

namespace AcasService.Web.Requests
{
    public class CreateClassroomQuizRequest
    {
        [Required(ErrorMessage = "Classroom ID is required")]
        public string ClassroomId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Quiz ID is required")]
        public string QuizId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Start time is required")]
        public DateTime StartTime { get; set; }

        [Required(ErrorMessage = "End time is required")]
        public DateTime EndTime { get; set; }

        public int MaxOfAttempts { get; set; } = 1;

        public string? Passcode { get; set; }

        [Required(ErrorMessage = "CreatedBy is required")]
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateClassroomQuizRequest
    {
        public DateTime? StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public int? MaxOfAttempts { get; set; }

        public string? Passcode { get; set; }

        public ClassroomQuizStatus? Status { get; set; }
    }
}
