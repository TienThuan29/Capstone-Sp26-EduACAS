using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs.External;

public class FormatCodeResponse
{
    [JsonPropertyName("formatted")]
    public string Formatted { get; set; } = string.Empty;

    [JsonPropertyName("stderr")]
    public string? Stderr { get; set; }

    [JsonPropertyName("code")]
    public int Code { get; set; }
}
