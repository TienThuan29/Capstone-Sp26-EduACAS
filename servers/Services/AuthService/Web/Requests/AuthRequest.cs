using System.Text.Json.Serialization;

namespace AuthService.Web.Requests; 

public class LoginCredentials
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterData
{
    public string Email { get; set; } = string.Empty;
    public string RoleNumber { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}