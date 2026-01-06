using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs
{
    public class ClassroomResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
        
        [JsonPropertyName("classCode")]
        public string ClassCode { get; set; } = string.Empty;

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = string.Empty;

        [JsonPropertyName("lecturerId")]
        public string LecturerId { get; set; } = string.Empty;

        [JsonPropertyName("subjectId")]
        public string SubjectId { get; set; } = string.Empty;

        [JsonPropertyName("semesterName")]
        public string SemesterName { get; set; } = string.Empty;

        [JsonPropertyName("enrolKey")]
        public string EnrolKey { get; set; } = string.Empty;

        [JsonPropertyName("createdDate")]
        public DateTime CreatedDate { get; set; }

        [JsonPropertyName("updatedDate")]
        public DateTime? UpdatedDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime EndDate { get; set; }
        
        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }
    }
}
