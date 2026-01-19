namespace AuthService.Application.ResponseDTOs;

public class AuthResponse
{
    public UserProfileResponse UserProfile { get; set; } = new();
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public bool FirstLogin { get; set; } = false;
}

public class UserProfileResponse
{
    public string Id { get; set; } = string.Empty;
    public string RoleNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public DateTime? Birthday { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsEnable { get; set; }
    public bool? FirstLogin { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}