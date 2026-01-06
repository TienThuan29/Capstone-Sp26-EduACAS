using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs
{
    public class SubjectResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("subjectCode")]
        public string SubjectCode { get; set; } = string.Empty;

        [JsonPropertyName("subjectName")]
        public string SubjectName { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("createdBy")]
        public string CreatedBy { get; set; } = string.Empty;

        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }

        [JsonPropertyName("createdDate")]
        public DateTime CreatedDate { get; set; }
        
        [JsonPropertyName("updatedDate")]
        public DateTime? UpdatedDate { get; set; }

    }
}
