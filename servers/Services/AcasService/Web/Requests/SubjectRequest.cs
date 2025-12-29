using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateSubjectRequest
    {
        [Required]
        public string SubjectCode { get; set; } = string.Empty;

        [Required]
        public string SubjectName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

    }

    public class UpdateSubjectRequest
    {
        [Required]
        public string SubjectCode { get; set; } = string.Empty;

        [Required]
        public string SubjectName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}
