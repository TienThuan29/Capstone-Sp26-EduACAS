using System.ComponentModel.DataAnnotations;

namespace AuthService.Web.Requests;

/// <summary>
/// Request to grant an account to a user via email
/// Only Admin can grant accounts to Lecturer and Student
/// </summary>
public class GrantAccountRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^\d+$", ErrorMessage = "RoleNumber must be numeric.")]
    public string RoleNumber { get; set; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(100)]
    public string Fullname { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(LECTURER|STUDENT)$", ErrorMessage = "Role must be LECTURER or STUDENT.")]
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// Request to reset password after first login
/// </summary>
public class ResetFirstLoginPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(5)]
    [MaxLength(64)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(5)]
    [MaxLength(64)]
    [Compare("NewPassword", ErrorMessage = "Password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
