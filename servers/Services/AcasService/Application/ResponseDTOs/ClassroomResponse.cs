using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class ClassroomResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("classCode")]
    public string ClassCode { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("lecturer")]
    public LecturerLiteResponse Lecturer { get; set; } = new LecturerLiteResponse();

    [JsonPropertyName("subject")]
    public SubjectLiteResponse Subject { get; set; } = new SubjectLiteResponse();

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

    [JsonPropertyName("maxSlot")]
    public int MaxSlot { get; set; }

    [JsonPropertyName("enrollment")]
    public EnrollmentInfoResponse Enrollment { get; set; } = new EnrollmentInfoResponse();

    [JsonPropertyName("studentCount")]
    public int StudentCount { get; set; }

    [JsonPropertyName("gradingSettings")]
    public GradingSettingsResponse GradingSettings { get; set; } = new GradingSettingsResponse();

}

public class GradingSettingsResponse
{
    [JsonPropertyName("avgScoreThreshold")]
    public float AvgScoreThreshold { get; set; }

    [JsonPropertyName("minExamCount")]
    public int MinExamCount { get; set; }
}

public class SubjectLiteResponse
{
    [JsonPropertyName("subjectId")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("subjectName")]
    public string SubjectName { get; set; } = string.Empty;
}

/// <summary>
/// Lecturer profile response; structure aligned with AuthService UserProfileResponse.
/// </summary>
public class LecturerLiteResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("fullname")]
    public string Fullname { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

}


public class EnrollmentInfoResponse
{
    [JsonPropertyName("isJoining")]
    public bool IsJoining { get; set; }

    [JsonPropertyName("joinedDate")]
    public DateTime? JoinedDate { get; set; }

    [JsonPropertyName("movedOutDate")]
    public DateTime? MovedOutDate { get; set; }
}

