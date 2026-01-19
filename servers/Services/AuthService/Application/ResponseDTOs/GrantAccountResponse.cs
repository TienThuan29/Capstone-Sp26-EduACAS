namespace AuthService.Application.ResponseDTOs;

/// <summary>
/// Response for granting an account
/// </summary>
public class GrantAccountResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string TemporaryPassword { get; set; } = string.Empty;
    public bool FirstLogin { get; set; } = true;
    public string Message { get; set; } = "Account created successfully and email sent with temporary credentials.";
}
