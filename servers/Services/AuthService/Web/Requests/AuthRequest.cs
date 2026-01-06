using System.ComponentModel.DataAnnotations;

namespace AuthService.Web.Requests; 

public class LoginCredentials
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RegisterData
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    // [RegularExpression(@"^\d+$", ErrorMessage = "RoleNumber must be numeric.")]
    public string RoleNumber { get; set; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(100)]
    public string Fullname { get; set; } = string.Empty;

    [Required]
    [MinLength(5)]
    [MaxLength(64)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(ADMIN|LECTURER|STUDENT)$", ErrorMessage = "Role must be ADMIN/LECTURER/STUDENT.")]
    public string Role { get; set; } = string.Empty;
}

public class VerifyEmailRequest
{
    [Required]
    public string RegisterSession { get; set; } = string.Empty;

    [Required]
    public string Opt { get; set; } = string.Empty;
}

// Forgot password request
public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public string NewPassword { get; set; } = string.Empty;
}

public class GoogleLoginRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}