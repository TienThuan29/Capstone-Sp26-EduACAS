using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class BulkSubmissionGradingRequest
{
  [JsonPropertyName("problemId")]
  public string ProblemId { get; set; } = string.Empty;

  [JsonPropertyName("examId")]
  public string ExamId { get; set; } = string.Empty;

  [JsonPropertyName("submissions")]
  public List<SubmissionGradingRequest> Submissions { get; set; } = new List<SubmissionGradingRequest>();
}

public class SingleSubmissionRegradeRequest
{
  [JsonPropertyName("compilerId")]
  public string CompilerId { get; set; } = string.Empty;

  [JsonPropertyName("languageId")]
  public string LanguageId { get; set; } = string.Empty;
}

public class SubmissionScoreOverrideRequest
{
  [JsonPropertyName("finalScore")]
  public float FinalScore { get; set; }

  [JsonPropertyName("maxMark")]
  public float MaxMark { get; set; }

  [JsonPropertyName("sendFeedbackToStudent")]
  public bool SendFeedbackToStudent { get; set; } = false;

  [JsonPropertyName("lecturerFeedback")]
  public string LecturerFeedback { get; set; } = string.Empty;

  [JsonPropertyName("materialRecommendation")]
  public List<string> MaterialRecommendation { get; set; } = new();
}

public class SaveLecturerFeedbackRequest
{
  [JsonPropertyName("lecturerFeedback")]
  public string LecturerFeedback { get; set; } = string.Empty;

  [JsonPropertyName("materialRecommendation")]
  public List<string> MaterialRecommendation { get; set; } = new();

  [JsonPropertyName("sendFeedbackToStudent")]
  public bool SendFeedbackToStudent { get; set; } = false;

  [JsonPropertyName("problemTitle")]
  public string? ProblemTitle { get; set; }
}

public class SubmissionGradingRequest
{
  [JsonPropertyName("id")]
  public string Id { get; set; } = string.Empty;

  [JsonPropertyName("studentId")]
  public string StudentId { get; set; } = string.Empty;

  [JsonPropertyName("languageId")]
  public string LanguageId { get; set; } = string.Empty;

  [JsonPropertyName("compilerId")]
  public string CompilerId { get; set; } = string.Empty;

  [JsonPropertyName("examId")]
  public string ExamId { get; set; } = string.Empty;

  [JsonPropertyName("problemId")]
  public string ProblemId { get; set; } = string.Empty;

  [JsonPropertyName("source")]
  public string Source { get; set; } = string.Empty;

}