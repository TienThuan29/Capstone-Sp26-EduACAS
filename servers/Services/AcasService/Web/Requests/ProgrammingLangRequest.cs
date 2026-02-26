using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests;

public class ProgrammingLanguageRequest
{
    [Required(ErrorMessage = "Language name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Language name must be between 1 and 100 characters")]
    public string LanguageName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Key is required")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Key must be between 1 and 50 characters")]
    public string Key { get; set; } = string.Empty;

    [Required(ErrorMessage = "Language version is required")]
    [StringLength(50, ErrorMessage = "Language version must not exceed 50 characters")]
    public string LanguageVersion { get; set; } = string.Empty;
}


public class UpdateStatusRequest
{
    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;
}

public class UpdateLogoUrlRequest
{
    [Required(ErrorMessage = "LogoFileUrl is required")]
    public string LogoFileUrl { get; set; } = string.Empty;
}
