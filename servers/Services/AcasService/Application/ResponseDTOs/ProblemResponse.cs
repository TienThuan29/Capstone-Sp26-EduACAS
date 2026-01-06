using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class ProblemResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("lecturerId")]
    public string LecturerId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonPropertyName("mark")]
    public float Mark { get; set; }

    [JsonPropertyName("difficulty")]
    public Difficulty Difficulty { get; set; }

    [JsonPropertyName("codeTemplate")]
    public string CodeTemplate { get; set; } = string.Empty;

    [JsonPropertyName("testCases")]
    public List<TestCaseResponse> TestCases { get; set; } = new List<TestCaseResponse>();

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
}

public class TestCaseResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("inputData")]
    public string InputData { get; set; } = string.Empty;

    [JsonPropertyName("expectedOutput")]
    public string ExpectedOutput { get; set; } = string.Empty;

    [JsonPropertyName("isPublic")]
    public bool IsPublic { get; set; }

    [JsonPropertyName("isCaseInsensitive")]
    public bool IsCaseInsensitive { get; set; }

    [JsonPropertyName("isRemovedSpace")]
    public bool IsRemovedSpace { get; set; }
}

public class ProblemBasicResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("mark")]
    public float Mark { get; set; }

    [JsonPropertyName("difficulty")]
    public Difficulty Difficulty { get; set; }
    
    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }
}
