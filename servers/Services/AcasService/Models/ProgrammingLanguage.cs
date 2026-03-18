using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("ProgrammingLanguageTableName")]
public class ProgrammingLanguage
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string Monaco { get; set; } = string.Empty;
    
    [Required]
    public List<string> Extensions { get; set; } = new List<string>();

    private List<string> Alias { get; set; } = new List<string>();

    public string LogoFileUrl { get; set; } = string.Empty;

    public string Formatter { get; set; } = string.Empty;

    public string DigitSeparator { get; set; } = string.Empty;

    public List<Compiler> Compilers { get; set; } = new List<Compiler>();
    
    public PLStatus Status { get; set; } = PLStatus.DISABLE;
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime UpdatedDate { get; set; }
}


public class Compiler
{
    [Required]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Group { get; set; } = string.Empty;

    public List<string> StdVersions { get; set; } = new List<string>(); /// for c/c++
}


public enum PLStatus
{
    ENABLE,
    DISABLE,
    MAINTAINANCE
}