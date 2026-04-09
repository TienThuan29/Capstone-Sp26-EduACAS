using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs
{
    public class MaterialResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("lecturerId")]
        public string LecturerId { get; set; } = string.Empty;

        [JsonPropertyName("classroomId")]
        public string ClassroomId { get; set; } = string.Empty;

        [JsonPropertyName("filename")]
        public string Filename { get; set; } = string.Empty;

        [JsonPropertyName("fileUrl")]
        public string FileUrl { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }

        [JsonPropertyName("lecturerName")]
        public string LecturerName { get; set; } = string.Empty;

        [JsonPropertyName("lecturerEmail")]
        public string LecturerEmail { get; set; } = string.Empty;

        [JsonPropertyName("createdDate")]
        public DateTime CreatedDate { get; set; }
    }
}
