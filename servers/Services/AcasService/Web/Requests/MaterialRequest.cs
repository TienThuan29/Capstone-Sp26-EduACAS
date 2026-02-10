using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateMaterialRequest
    {
        [Required(ErrorMessage = "Lecturer ID is required")]
        public string LecturerId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Classroom ID is required")]
        public string ClassroomId { get; set; } = string.Empty;

        [Required(ErrorMessage = "File is required")]
        public IFormFile File { get; set; } = default!;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateMaterialRequest
    {
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; } = string.Empty;
    }
}
