using System.ComponentModel.DataAnnotations;

namespace AcasService.Application.Requests.ProgrammingLanguage;

public class ProgrammingLanguageRequest
{
    [Required(ErrorMessage = "Language name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Language name must be between 2 and 100 characters")]
    public string LanguageName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Key is required")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Key must be between 2 and 50 characters")]
    [RegularExpression(@"^[a-z0-9_-]+$", ErrorMessage = "Key must contain only lowercase letters, numbers, hyphens and underscores")]
    public string Key { get; set; } = string.Empty;

    [Required(ErrorMessage = "Language version is required")]
    [RegularExpression(@"^\d+(\.\d+)*$", ErrorMessage = "Language version must be in format: X.Y.Z (e.g., 8.0, 17.0.1)")]
    public string LanguageVersion { get; set; } = string.Empty;
}


