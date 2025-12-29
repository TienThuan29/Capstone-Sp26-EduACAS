using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateClassroomRequest
    {
        [Required]
        public string ClassCode { get; set; } = string.Empty;
        [Required]
        public string ClassName { get; set; } = string.Empty;
        //[Required]
        //public string LecturerId { get; set; } = string.Empty; 
        [Required]
        public string SubjectId { get; set; } = string.Empty;  
        [Required]
        public string SemesterName { get; set; } = string.Empty;
        [Required]
        public string EnrolKey { get; set; } = string.Empty;
        public DateTime EndDate { get; set; }
    }

    public class UpdateClassroomRequest
    {
        [Required]
        public string ClassCode { get; set; } = string.Empty;
        [Required]
        public string ClassName { get; set; } = string.Empty;
        //[Required]
        //public string LecturerId { get; set; } = string.Empty; 
        [Required]
        public string SubjectId { get; set; } = string.Empty;  
        [Required]
        public string SemesterName { get; set; } = string.Empty;
        [Required]
        public string EnrolKey { get; set; } = string.Empty;
        public DateTime EndDate { get; set; }
    }
}
