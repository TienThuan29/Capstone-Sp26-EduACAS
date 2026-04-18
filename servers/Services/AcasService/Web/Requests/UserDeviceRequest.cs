using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests;

public class RegisterUserDeviceRequest
{
    [Required]
    public string DeviceToken { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(ANDROID|IOS|WEB)$", ErrorMessage = "Platform must be ANDROID/IOS/WEB.")]
    public string Platform { get; set; } = string.Empty;

    public string? DeviceId { get; set; }

    public string? AppVersion { get; set; }
}

public class CheckUserDeviceTokenRequest
{
    [Required]
    public string DeviceToken { get; set; } = string.Empty;

    public string? DeviceId { get; set; }
}
