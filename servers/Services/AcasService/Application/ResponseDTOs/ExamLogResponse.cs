using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class ExamLogResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("submissionId")]
    public string SubmissionId { get; set; } = string.Empty;

    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("eventDetail")]
    public string EventDetail { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; set; } = string.Empty;

    [JsonPropertyName("isViolation")]
    public bool IsViolation { get; set; }

    [JsonPropertyName("clientTimestamp")]
    public DateTime ClientTimestamp { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }
}
