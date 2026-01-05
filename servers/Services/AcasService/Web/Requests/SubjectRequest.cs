using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateSubjectRequest
    {
        [Required(ErrorMessage = "Subject code must be not null")]
        public string SubjectCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject name must be not null")]
        public string SubjectName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "CreatedBy must be not null")]
        public string CreatedBy { get; set; } = string.Empty;

    }

    public class UpdateSubjectRequest
    {
        [Required(ErrorMessage = "Subject code must be not null")]
        public string SubjectCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject name must be not null")]
        public string SubjectName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}
