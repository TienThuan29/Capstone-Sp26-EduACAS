using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class ProgrammingLanguage
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string LanguageName { get; set; } = string.Empty;
    
    [Required]
    public string Key { get; set; } = string.Empty;
    
    public string LanguageVersion { get; set; } = string.Empty;
    
    public bool IsEnable { get; set; }
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime UpdatedDate { get; set; }
}