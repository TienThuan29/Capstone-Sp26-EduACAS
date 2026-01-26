using System.Text.Json.Serialization;

namespace AuthService.Application.ResponseDTOs;

/// <summary>
/// Response for granting an account
/// </summary>
public class GrantAccountResponse
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("fullname")]
    public string Fullname { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("temporaryPassword")]
    public string TemporaryPassword { get; set; } = string.Empty;

    [JsonPropertyName("firstLogin")]
    public bool FirstLogin { get; set; } = true;

}
