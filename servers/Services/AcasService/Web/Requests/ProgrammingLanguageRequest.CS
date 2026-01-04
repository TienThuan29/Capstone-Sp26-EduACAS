using System.ComponentModel.DataAnnotations;

namespace AcasService.Application.Requests.ProgrammingLanguage;

public class ProgrammingLanguageRequest
{
    [Required]
    public string LanguageName { get; set; } = string.Empty;

    [Required]
    public string Key { get; set; } = string.Empty;

    
    [Required]
    public string LanguageVersion { get; set; } = string.Empty;
}

