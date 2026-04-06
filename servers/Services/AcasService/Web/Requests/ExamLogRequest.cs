using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class CreateExamLogRequest
{
    [Required]
    [JsonPropertyName("submissionId")]
    public string SubmissionId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("eventDetail")]
    public string EventDetail { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("severity")]
    public string Severity { get; set; } = "info";

    [JsonPropertyName("isViolation")]
    public bool IsViolation { get; set; }

    [JsonPropertyName("clientTimestamp")]
    public DateTime ClientTimestamp { get; set; }
}

public class CacheExamLogEntryRequest
{
    [Required]
    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("eventDetail")]
    public string EventDetail { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("severity")]
    public string Severity { get; set; } = "info";

    [JsonPropertyName("isViolation")]
    public bool IsViolation { get; set; }

    [JsonPropertyName("clientTimestamp")]
    public DateTime ClientTimestamp { get; set; }
}

public class CacheExamLogsRequest
{
    [Required]
    [JsonPropertyName("sessionKey")]
    public string SessionKey { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("entries")]
    public List<CacheExamLogEntryRequest> Entries { get; set; } = new();
}

public class FlushCachedExamLogsRequest
{
    [Required]
    [JsonPropertyName("sessionKey")]
    public string SessionKey { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("submissionId")]
    public string SubmissionId { get; set; } = string.Empty;
}
