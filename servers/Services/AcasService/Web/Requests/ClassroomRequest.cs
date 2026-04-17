using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;
public class GradingSettingsRequest
{
    [JsonPropertyName("avgScoreThreshold")]
    [Range(0, 10, ErrorMessage = "AvgScoreThreshold must be between 0 and 10")]
    public float AvgScoreThreshold { get; set; } = 5.0f;

    [JsonPropertyName("minExamCount")]
    [Range(2, int.MaxValue, ErrorMessage = "MinExamCount must be at least 2")]
    public int MinExamCount { get; set; } = 2;
}

public class CreateClassroomRequest
{
    [JsonPropertyName("classCode")]
    [Required(ErrorMessage = "Class code must be not null")]
    public string ClassCode { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    [Required(ErrorMessage = "Class name must be not null")]
    [StringLength(100, ErrorMessage = "Class name cannot exceed 100 characters")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("lecturerId")]
    [Required(ErrorMessage = "Lecturer id must be not null")]
    public string LecturerId { get; set; } = string.Empty;

    [JsonPropertyName("subjectId")]
    [Required(ErrorMessage = "Subject id must be not null")]
    public string SubjectId { get; set; } = string.Empty;

    [JsonPropertyName("semesterName")]
    [Required(ErrorMessage = "Semester name must be not null")]
    public string SemesterName { get; set; } = string.Empty;

    [JsonPropertyName("enrolKey")]
    [RegularExpression(@"^(?=.*[^a-zA-Z0-9])\S{6,20}$",
    ErrorMessage = "EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces")]
    public string? EnrolKey { get; set; } = string.Empty;

    [JsonPropertyName("maxSlot")]
    [Required(ErrorMessage = "MaxSlot is required")]
    [Range(2, int.MaxValue, ErrorMessage = "MaxSlot must be greater than 1")]
    public int MaxSlot { get; set; }

    [JsonPropertyName("endDate")]
    public DateTime EndDate { get; set; }

    [JsonPropertyName("gradingSettings")]
    public GradingSettingsRequest? GradingSettings { get; set; }
}

public class UpdateClassroomRequest
{
    [JsonPropertyName("classCode")]
    [Required(ErrorMessage = "Class code must be not null")]
    public string ClassCode { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    [Required(ErrorMessage = "Class name must be not null")]
    [StringLength(100, ErrorMessage = "Class name cannot exceed 100 characters")]
    public string ClassName { get; set; } = string.Empty;

    [JsonPropertyName("subjectId")]
    [Required(ErrorMessage = "Subject id must be not null")]
    public string SubjectId { get; set; } = string.Empty;

    [JsonPropertyName("semesterName")]
    [Required(ErrorMessage = "Semester name must be not null")]
    public string SemesterName { get; set; } = string.Empty;

    [JsonPropertyName("enrolKey")]
    [Required(ErrorMessage = "EnrolKey must be not null")]
    // [RegularExpression(@"^(?=.*[^a-zA-Z0-9])\S{6,20}$",
    //     ErrorMessage = "EnrolKey must be 6-20 characters long, contain at least one special character, and must not contain spaces")]
    public string EnrolKey { get; set; } = string.Empty;

    [JsonPropertyName("maxSlot")]
    [Required(ErrorMessage = "MaxSlot is required")]
    [Range(2, int.MaxValue, ErrorMessage = "MaxSlot must be greater than 1")]
    public int MaxSlot { get; set; }

    [JsonPropertyName("endDate")]
    public DateTime EndDate { get; set; }

    [JsonPropertyName("gradingSettings")]
    public GradingSettingsRequest? GradingSettings { get; set; }
}

public class SearchClassroomRequest
{
    [JsonPropertyName("classCode")]
    public string ClassCode { get; set; } = string.Empty;
}

public class GetClassroomRequest
{
    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
}
