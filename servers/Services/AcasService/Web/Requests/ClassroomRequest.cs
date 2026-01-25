using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateClassroomRequest
    {
        [Required(ErrorMessage = "Class code must be not null")]
        public string ClassCode { get; set; } = string.Empty;
        [Required(ErrorMessage = "Class name must be not null")]
        [StringLength(100, ErrorMessage = "Class name cannot exceed 100 characters")]
        public string ClassName { get; set; } = string.Empty;
        [Required(ErrorMessage = "Lecturer id must be not null")]
        public string LecturerId { get; set; } = string.Empty;
        [Required(ErrorMessage = "Subject id must be not null")]
        public string SubjectId { get; set; } = string.Empty;  
        [Required(ErrorMessage = "Semester name must be not null")]
        public string SemesterName { get; set; } = string.Empty;

        [RegularExpression(@"^(?=.*[^a-zA-Z0-9])\S{6,20}$",
            ErrorMessage = "EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces")]
        public string? EnrolKey { get; set; } = string.Empty;

        public DateTime EndDate { get; set; }

        
    }

    public class UpdateClassroomRequest
    {
        [Required(ErrorMessage = "Class code must be not null")]
        public string ClassCode { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Class name must be not null")]
        [StringLength(100, ErrorMessage = "Class name cannot exceed 100 characters")]
        public string ClassName { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Subject id must be not null")]
        public string SubjectId { get; set; } = string.Empty;  
        
        [Required(ErrorMessage = "Semester name must be not null")]
        public string SemesterName { get; set; } = string.Empty;
        [Required(ErrorMessage = "EnrolKey must be not null")]
        [RegularExpression(@"^(?=.*[^a-zA-Z0-9])\S{6,20}$",
            ErrorMessage = "EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces")]
        public string EnrolKey { get; set; } = string.Empty;
        public DateTime EndDate { get; set; }
    }

    public class SearchClassroomRequest
    {
        public string ClassCode { get; set; } = string.Empty;
        
    }

    public class GetClassroomRequest
    {
        public string ClassroomId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }
}
