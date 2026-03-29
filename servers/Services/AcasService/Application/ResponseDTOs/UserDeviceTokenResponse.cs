using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class UserDeviceTokenResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("deviceToken")]
    public string DeviceToken { get; set; } = string.Empty;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = string.Empty;

    [JsonPropertyName("deviceId")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("appVersion")]
    public string AppVersion { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("lastSeenAt")]
    public DateTime? LastSeenAt { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime? CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime? UpdatedDate { get; set; }
}

public class UserDeviceTokenCheckResponse
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("deviceToken")]
    public string DeviceToken { get; set; } = string.Empty;

    [JsonPropertyName("deviceId")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("isRegisteredForCurrentUser")]
    public bool IsRegisteredForCurrentUser { get; set; }

    [JsonPropertyName("isTokenUsedByAnotherUser")]
    public bool IsTokenUsedByAnotherUser { get; set; }

    [JsonPropertyName("isDeviceUsedByAnotherUser")]
    public bool IsDeviceUsedByAnotherUser { get; set; }

    [JsonPropertyName("otherUserIdsUsingSameToken")]
    public List<string> OtherUserIdsUsingSameToken { get; set; } = new();

    [JsonPropertyName("otherUserIdsUsingSameDevice")]
    public List<string> OtherUserIdsUsingSameDevice { get; set; } = new();
}
