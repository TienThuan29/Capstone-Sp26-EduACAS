
using System.Text.Json.Serialization;
using AcasService.Models;

public class TestResultResponse
{
      [JsonPropertyName("id")]
      public string Id { get; set; } = string.Empty;

      [JsonPropertyName("testcaseId")]
      public string TestcaseId { get; set; } = string.Empty;

      [JsonPropertyName("input")]
      public string Input { get; set; } = string.Empty;

      [JsonPropertyName("actualOutput")]
      public string ActualOutput { get; set; } = string.Empty;

      [JsonPropertyName("expectedOutput")]
      public string ExpectedOutput { get; set; } = string.Empty;

      [JsonPropertyName("executionTimeMs")]
      public int ExecutionTimeMs { get; set; }

      [JsonPropertyName("status")]
      public string Status { get; set; } = string.Empty;

      [JsonPropertyName("createdDate")]
      public DateTime CreatedDate { get; set; }
}