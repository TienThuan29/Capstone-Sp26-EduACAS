using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class ClassroomStudentResponse
{
    [JsonPropertyName("enrollmentId")]
    public string EnrollmentId { get; set; } = string.Empty;

    [JsonPropertyName("studentId")]
    public string StudentId { get; set; } = string.Empty;

    [JsonPropertyName("joinedDate")]
    public DateTime JoinedDate { get; set; }

    [JsonPropertyName("isJoining")]
    public bool IsJoining { get; set; }

    // Student info from AuthService
    [JsonPropertyName("roleNumber")]
    public string RoleNumber { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("fullname")]
    public string Fullname { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [JsonPropertyName("birthday")]
    public DateTime? Birthday { get; set; }

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("isEnable")]
    public bool IsEnable { get; set; }
}
