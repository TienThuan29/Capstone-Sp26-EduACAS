using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using AcasService.Models;

namespace AcasService.Web.Requests;

public class CreateRegradingRequest
{
    private const int MaxImageCount = 10;
    private const int MaxImageUrlLength = 2048;

    [JsonPropertyName("examinationId")]
    [Required(ErrorMessage = "Examination ID is required")]
    public string ExaminationId { get; set; } = string.Empty;

    [JsonPropertyName("submissionId")]
    [Required(ErrorMessage = "Submission ID is required")]
    public string SubmissionId { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    [Required(ErrorMessage = "Reason is required")]
    [MinLength(10, ErrorMessage = "Reason must be at least 10 characters")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("imageUrls")]
    public List<string> ImageUrls { get; set; } = new List<string>();

    public IEnumerable<ValidationResult> Validate()
    {
        var results = new List<ValidationResult>();

        if (ImageUrls != null && ImageUrls.Count > MaxImageCount)
        {
            results.Add(new ValidationResult(
                $"Maximum {MaxImageCount} images allowed. You provided {ImageUrls.Count}.",
                new[] { nameof(ImageUrls) }
            ));
        }

        if (ImageUrls != null)
        {
            for (int i = 0; i < ImageUrls.Count; i++)
            {
                var url = ImageUrls[i];
                if (string.IsNullOrWhiteSpace(url))
                {
                    results.Add(new ValidationResult(
                        $"Image URL at position {i + 1} cannot be empty.",
                        new[] { nameof(ImageUrls) }
                    ));
                }
                else if (url.Length > MaxImageUrlLength)
                {
                    results.Add(new ValidationResult(
                        $"Image URL at position {i + 1} exceeds maximum length of {MaxImageUrlLength} characters.",
                        new[] { nameof(ImageUrls) }
                    ));
                }
                // Basic URL validation
                else if (!Uri.TryCreate(url, UriKind.Absolute, out var uriResult) ||
                         (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
                {
                    results.Add(new ValidationResult(
                        $"Image URL at position {i + 1} is not a valid HTTP/HTTPS URL.",
                        new[] { nameof(ImageUrls) }
                    ));
                }
            }
        }

        return results;
    }
}

public class HandleRegradingRequest
{
    [JsonPropertyName("lecturerNote")]
    public string LecturerNote { get; set; } = string.Empty;
}

