using System.Text.Json.Serialization;

namespace AuthService.Application.ResponseDTOs;

public class AuthResponse
{
    [JsonPropertyName("userProfile")]
    public UserProfileResponse UserProfile { get; set; } = new();

    [JsonPropertyName("accessToken")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("refreshToken")]
    public string RefreshToken { get; set; } = string.Empty;
    
    [JsonPropertyName("firstLogin")]
    public bool FirstLogin { get; set; } = false;
}

public class UserProfileResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("roleNumber")]
    public string RoleNumber { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("fullname")]
    public string Fullname { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [JsonPropertyName("birthday")]
    public DateTime? Birthday { get; set; }

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("isEnable")]
    public bool IsEnable { get; set; }

    [JsonPropertyName("firstLogin")]
    public bool? FirstLogin { get; set; }

    [JsonPropertyName("lastLoginDate")]
    public DateTime? LastLoginDate { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime? CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime? UpdatedDate { get; set; }
}