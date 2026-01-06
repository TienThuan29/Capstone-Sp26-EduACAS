using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

    public class ExaminationResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("examName")]
        public string ExamName { get; set; } = string.Empty;

        [JsonPropertyName("programmingLanguageId")]
        public string ProgrammingLanguageId { get; set; } = string.Empty;

        [JsonPropertyName("problemIds")]
        public string[] ProblemIds { get; set; } = Array.Empty<string>();

        [JsonPropertyName("classroomId")]
        public string ClassroomId { get; set; } = string.Empty;

        [JsonPropertyName("startDatetime")]
        public DateTime StartDatetime { get; set; }

        [JsonPropertyName("endDatetime")]
        public DateTime EndDatetime { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("isPublicResult")]
        public bool IsPublicResult { get; set; }

        [JsonPropertyName("totalMark")]
        public float TotalMark { get; set; }

        [JsonPropertyName("status")]
        public Status Status { get; set; }

        [JsonPropertyName("mode")]
        public Mode Mode { get; set; }

        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }

        [JsonPropertyName("createdDate")]
        public DateTime CreatedDate { get; set; }

        [JsonPropertyName("updatedDate")]
        public DateTime UpdatedDate { get; set; }
    }