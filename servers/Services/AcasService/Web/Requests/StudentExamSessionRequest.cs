using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class StudentExamSessionExamIdRequest
{
    [Required]
    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;
}

public class StudentExamSessionLockRequest : StudentExamSessionExamIdRequest
{
    [JsonPropertyName("lockReason")]
    public string? LockReason { get; set; }
}

public class StudentExamSessionSetProblemRequest : StudentExamSessionExamIdRequest
{
    [JsonPropertyName("problemId")]
    public string? ProblemId { get; set; }
}
