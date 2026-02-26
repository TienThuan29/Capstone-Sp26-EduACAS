using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class BulkOperationResult
{
    [JsonPropertyName("totalRequested")]
    public int TotalRequested { get; set; }

    [JsonPropertyName("successCount")]
    public int SuccessCount { get; set; }

    [JsonPropertyName("failedCount")]
    public int FailedCount { get; set; }

    [JsonPropertyName("message")]
    public string Message => $"Successfully processed {SuccessCount} out of {TotalRequested} items. Failed: {FailedCount}";
}


