using System.ComponentModel.DataAnnotations;
using AuthService.Models;

namespace AuthService.Web.Requests;

public class UpdateUserRequest
{
    [StringLength(100, ErrorMessage = "Fullname must not exceed 100 characters")]
    public string? Fullname { get; set; }

    public string? RoleNumber { get; set; }

    public string? Role { get; set; }

    public bool? IsEnable { get; set; }
    
    // Helper method to convert Role string to enum
    public Role? GetRoleEnum()
    {
        if (string.IsNullOrWhiteSpace(Role))
            return null;
        
        if (Enum.TryParse<Role>(Role, true, out var roleEnum))
            return roleEnum;
        
        return null;
    }
}
