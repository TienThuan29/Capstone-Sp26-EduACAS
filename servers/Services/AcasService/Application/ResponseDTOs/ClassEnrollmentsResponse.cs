

using System.Text.Json.Serialization;

namespace AcasService.Application.ClassroomEnrollment.ResponseDTOs
{
    public class ClassEnrollmentsResponse
    {
        [JsonPropertyName("enrollmentId")]
        public string EnrollmentId { get; set; } = string.Empty;

        [JsonPropertyName("classId")]
        public string ClassId { get; set; } = string.Empty;

        [JsonPropertyName("studentId")]
        public string StudentId { get; set; } = string.Empty;

        [JsonPropertyName("joinedDate")]
        public DateTime JoinedDate { get; set; } = DateTime.MinValue;

        [JsonPropertyName("movedOutDate")]
        public DateTime? MovedOutDate { get; set; }

        [JsonPropertyName("isJoining")]
        public bool IsJoining { get; set; } = false;
    }
}