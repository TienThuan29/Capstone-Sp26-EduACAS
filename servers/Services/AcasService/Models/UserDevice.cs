using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class UserDevice
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public string DeviceToken { get; set; } = string.Empty;

    [Required]
    public string Platform { get; set; } = string.Empty;

    public string DeviceId { get; set; } = string.Empty;

    public string AppVersion { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime? LastSeenAt { get; set; }

    public DateTime? CreatedDate { get; set; }

    public DateTime? UpdatedDate { get; set; }
}
