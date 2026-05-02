using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class ExaminationResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("programmingLanguage")]
    public ProgrammingLanguageResponse ProgrammingLanguage { get; set; } = new ProgrammingLanguageResponse();

    // [JsonPropertyName("problemIds")]
    // public string[] ProblemIds { get; set; } = Array.Empty<string>();

    [JsonPropertyName("examProblems")]
    public List<ExaminationProblemResponse> ExamProblems { get; set; } = new();

    [JsonPropertyName("classroom")]
    public ClassroomLiteResponse Classroom { get; set; } = new ClassroomLiteResponse();
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

    [JsonPropertyName("useStrict")]
    public bool UseStrict { get; set; }

    [JsonPropertyName("minScoreThreshold")]
    public float MinScoreThreshold { get; set; }

    [JsonPropertyName("maxAttempts")]
    public int? MaxAttempts { get; set; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }

}

public class ExaminationProblemResponse
{
    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("mark")]
    public float Mark { get; set; }

    [JsonPropertyName("title")]
    public String Title { get; set; }

}

public class ClassroomLiteResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("className")]
    public string ClassName { get; set; } = string.Empty;
}

public class ExaminationBasicResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("startDatetime")]
    public DateTime StartDatetime { get; set; }

    [JsonPropertyName("endDatetime")]
    public DateTime EndDatetime { get; set; }

    [JsonPropertyName("status")]
    public Status Status { get; set; }

    [JsonPropertyName("mode")]
    public Mode Mode { get; set; }
}

public class ExaminationSpecProblemResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("examName")]
    public string ExamName { get; set; } = string.Empty;

    [JsonPropertyName("programmingLanguage")]
    public ProgrammingLanguageResponse ProgrammingLanguage { get; set; } = new ProgrammingLanguageResponse();

    [JsonPropertyName("problem")]
    public ProblemResponse Problem { get; set; } = new();

    [JsonPropertyName("classroom")]
    public ClassroomLiteResponse Classroom { get; set; } = new ClassroomLiteResponse();

    [JsonPropertyName("startDatetime")]
    public DateTime StartDatetime { get; set; }

    [JsonPropertyName("endDatetime")]
    public DateTime EndDatetime { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("mode")]
    public Mode Mode { get; set; }

    [JsonPropertyName("useStrict")]
    public bool UseStrict { get; set; }

}