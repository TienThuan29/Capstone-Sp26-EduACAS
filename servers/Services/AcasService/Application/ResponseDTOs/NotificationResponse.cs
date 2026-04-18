using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class NotificationResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("targetUserId")]
    public string TargetUserId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public NotificationType Type { get; set; }

    [JsonPropertyName("payload")]
    public Dictionary<string, object?> Payload { get; set; } = new();

    [JsonPropertyName("sentDate")]
    public DateTime SentDate { get; set; }

    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }
}

public class NotificationDispatchResponse
{
    [JsonPropertyName("notificationId")]
    public string NotificationId { get; set; } = string.Empty;

    [JsonPropertyName("targetUserId")]
    public string TargetUserId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("sentDate")]
    public DateTime SentDate { get; set; }

    [JsonPropertyName("totalTokens")]
    public int TotalTokens { get; set; }

    [JsonPropertyName("successCount")]
    public int SuccessCount { get; set; }

    [JsonPropertyName("failureCount")]
    public int FailureCount { get; set; }
}
