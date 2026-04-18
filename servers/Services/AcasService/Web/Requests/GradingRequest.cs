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