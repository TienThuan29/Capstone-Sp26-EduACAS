using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateSubjectRequest
    {
        [Required(ErrorMessage = "Subject code is required")]
        [StringLength(20, MinimumLength = 1, ErrorMessage = "Subject code must be between 1 and 20 characters")]
        public string SubjectCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject name is required")]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Subject name must be between 1 and 200 characters")]
        public string SubjectName { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "CreatedBy is required")]
        [StringLength(100, ErrorMessage = "CreatedBy cannot exceed 100 characters")]
        public string CreatedBy { get; set; } = string.Empty; 

    }

    public class UpdateSubjectRequest
    {
        [Required(ErrorMessage = "Subject code is required")]
        [StringLength(20, MinimumLength = 1, ErrorMessage = "Subject code must be between 1 and 20 characters")]
        public string SubjectCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject name is required")]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Subject name must be between 1 and 200 characters")]
        public string SubjectName { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string Description { get; set; } = string.Empty;
    }

    public class BulkSubjectOperationRequest
    {
        [Required(ErrorMessage = "Subject IDs are required")]
        [MinLength(1, ErrorMessage = "At least one subject ID is required")]
        public List<string> SubjectIds { get; set; } = new();
    }
}
