using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;


public class ProgrammingLanguageResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("languageName")]
    public string LanguageName { get; set; } = string.Empty;

    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("languageVersion")]
    public string LanguageVersion { get; set; } = string.Empty;

    [JsonPropertyName("isEnable")]
    public bool IsEnable { get; set; }

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("updatedDate")]
    public DateTime UpdatedDate { get; set; }
}
