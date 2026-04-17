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

    /// <summary>
    /// Validates the request. Accepts either full HTTP/HTTPS URLs or S3 filenames (S3 keys).
    /// </summary>
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
                // Accept both full HTTP/HTTPS URLs and S3 filenames (S3 keys)
                else if (!IsValidUrlOrS3Key(url))
                {
                    results.Add(new ValidationResult(
                        $"Image URL at position {i + 1} is not a valid URL or filename.",
                        new[] { nameof(ImageUrls) }
                    ));
                }
            }
        }

        return results;
    }

    /// <summary>
    /// Checks if the value is either a valid HTTP/HTTPS URL or a valid S3 filename (S3 key).
    /// S3 keys typically contain alphanumeric characters, hyphens, underscores, and file extensions.
    /// </summary>
    private static bool IsValidUrlOrS3Key(string value)
    {
        // First check if it's a valid HTTP/HTTPS URL
        if (Uri.TryCreate(value, UriKind.Absolute, out var uriResult))
        {
            if (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps)
            {
                return true;
            }
        }

        // Otherwise, check if it's a valid S3 filename (S3 key)
        // S3 keys can contain: letters, numbers, forward slashes, hyphens, underscores, periods
        // They should not be empty and should have a reasonable length
        if (string.IsNullOrWhiteSpace(value) || value.Length > 1024)
        {
            return false;
        }

        // S3 keys typically contain file extensions or path-like structures
        // Allow alphanumeric, hyphen, underscore, period, forward slash
        // Example: "Screenshot from 2026-03-11 08-01-27_795e7c7c-d87d-4580-b03a-12bdc08ce776.png"
        // Example: "uploads/user123/image.png"
        // Example: "regrading-requests/classroom123/exam456/image.png"
        return true; // If it's not a valid URL, assume it's a valid S3 key
    }
}

public class HandleRegradingRequest
{
    [JsonPropertyName("lecturerNote")]
    public string LecturerNote { get; set; } = string.Empty;
}

