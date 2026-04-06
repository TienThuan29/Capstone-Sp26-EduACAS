using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class FormatCodeRequest
{
    [Required(ErrorMessage = "Source code is required")]
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;
}
