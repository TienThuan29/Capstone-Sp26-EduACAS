using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;


public class ProgrammingLanguageResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("monaco")]
    public string Monaco { get; set; } = string.Empty;

    [JsonPropertyName("extensions")]
    public List<string> Extensions { get; set; } = new List<string>();

    [JsonPropertyName("logoFileUrl")]
    public string LogoFileUrl { get; set; } = string.Empty;

    [JsonPropertyName("formatter")]
    public string Formatter { get; set; } = string.Empty;

    [JsonPropertyName("digitSeparator")]
    public string DigitSeparator { get; set; } = string.Empty;

    [JsonPropertyName("compilers")]
    public List<CompilerResponse> Compilers { get; set; } = new List<CompilerResponse>();

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
}

public class CompilerResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("group")]
    public string Group { get; set; } = string.Empty;

    [JsonPropertyName("stdVersions")]
    public List<string> StdVersions { get; set; } = new List<string>();
}
