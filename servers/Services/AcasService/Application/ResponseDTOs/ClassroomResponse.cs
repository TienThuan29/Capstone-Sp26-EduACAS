namespace AcasService.Application.ResponseDTOs
{
    public class ClassroomResponse
    {
        public string Id { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string LecturerId { get; set; } = string.Empty;
        public string SubjectId { get; set; } = string.Empty;
        public string SemesterName { get; set; } = string.Empty;
        public string EnrolKey { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsDeleted { get; set; }
    }
}
