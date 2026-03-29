using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests;

public class CreateNotificationRequest
{
    [Required]
    public string TargetUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Body { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = string.Empty;

    public Dictionary<string, object?>? Payload { get; set; }
}
