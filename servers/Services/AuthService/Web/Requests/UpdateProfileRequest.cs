using System.ComponentModel.DataAnnotations;

namespace AuthService.Web.Requests;

public class UpdateProfileRequest
{
    [StringLength(100, ErrorMessage = "Fullname must not exceed 100 characters")]
    public string? Fullname { get; set; }

    /// <summary>
    /// Birthday in ISO date format (e.g. yyyy-MM-dd).
    /// </summary>
    public string? Birthday { get; set; }

    [StringLength(2048, ErrorMessage = "Avatar URL must not exceed 2048 characters")]
    public string? AvatarUrl { get; set; }
}
