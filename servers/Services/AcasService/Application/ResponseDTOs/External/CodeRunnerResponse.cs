using System.Text.Json.Serialization;

namespace AcasService.Application.ExternalDTOs;

/// <summary>
/// DTO for language response from code-runner service
/// GET: /api/languages
/// </summary>
public class CodeRunnerLanguageDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("monaco")]
    public string Monaco { get; set; } = string.Empty;

    [JsonPropertyName("extensions")]
    public List<string> Extensions { get; set; } = new List<string>();

    [JsonPropertyName("alias")]
    public List<string> Alias { get; set; } = new List<string>();

    [JsonPropertyName("logoFilename")]
    public string? LogoFilename { get; set; }

    [JsonPropertyName("logoFilenameDark")]
    public string? LogoFilenameDark { get; set; }

    [JsonPropertyName("formatter")]
    public string? Formatter { get; set; }

    [JsonPropertyName("digitSeparator")]
    public string? DigitSeparator { get; set; }

    [JsonPropertyName("supportsExecute")]
    public bool SupportsExecute { get; set; }

    [JsonPropertyName("example")]
    public string? Example { get; set; }
}

/// <summary>
/// DTO for compiler response from code-runner service
/// GET: /api/compilers
/// </summary>
public class CodeRunnerCompilerDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("group")]
    public string Group { get; set; } = string.Empty;

    [JsonPropertyName("stdVersions")]
    public List<string>? StdVersions { get; set; }
}
