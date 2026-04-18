using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AcasService.Application.Thirdparty;

public interface IGeminiClient
{
    /// <summary>
    /// Sends a prompt to the Gemini API and returns the generated text response.
    /// </summary>
    Task<string> GenerateContentAsync(string prompt, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a prompt with optional generation config (e.g. max tokens, temperature).
    /// </summary>
    Task<string> GenerateContentAsync(
        string prompt,
        GeminiGenerationConfig? generationConfig = null,
        CancellationToken cancellationToken = default);
}

public class GeminiClient : IGeminiClient
{
    private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta";
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiClient> _logger;
    private readonly string _modelName;
    private readonly string _apiKey;
    private readonly JsonSerializerOptions _jsonOptions;

    public GeminiClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _modelName = configuration["Gemini:ModelName"] ?? throw new InvalidOperationException("Gemini:ModelName is not configured");
        _apiKey = configuration["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini:ApiKey is not configured");

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    public async Task<string> GenerateContentAsync(string prompt, CancellationToken cancellationToken = default)
        => await GenerateContentAsync(prompt, null, cancellationToken);

    public async Task<string> GenerateContentAsync(
        string prompt,
        GeminiGenerationConfig? generationConfig = null,
        CancellationToken cancellationToken = default)
    {
        var request = new GeminiGenerateContentRequest
        {
            Contents =
            [
                new GeminiContent
                {
                    Parts = [new GeminiPart { Text = prompt }]
                }
            ],
            GenerationConfig = generationConfig
        };

        var url = $"{BaseUrl}/models/{_modelName}:generateContent";
        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        // Use header approach (primary) + query param (fallback) per Gemini spec
        httpRequest.Headers.Add("x-goog-api-key", _apiKey);
        _logger.LogInformation(
            "Gemini API request: Url={Url}, Headers={Headers}, BodyLength={BodyLength}",
            url,
            string.Join("; ", httpRequest.Headers.Select(h => $"{h.Key}={string.Join(",", h.Value)}")),
            json.Length);

        var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Gemini API error: StatusCode={StatusCode}, Response={Response}",
                response.StatusCode,
                responseBody);
            response.EnsureSuccessStatusCode();
        }

        var parsed = JsonSerializer.Deserialize<GeminiGenerateContentResponse>(responseBody, _jsonOptions);
        var text = parsed?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

        if (string.IsNullOrEmpty(text))
        {
            _logger.LogWarning("Gemini API returned empty or missing text. Response: {Response}", responseBody);
            return string.Empty;
        }

        return text;
    }
}


#region Request/Response DTOs

public sealed class GeminiGenerationConfig
{
    [JsonPropertyName("temperature")]
    public double? Temperature { get; set; }

    [JsonPropertyName("topP")]
    public double? TopP { get; set; }

    [JsonPropertyName("topK")]
    public int? TopK { get; set; }

    [JsonPropertyName("maxOutputTokens")]
    public int? MaxOutputTokens { get; set; }

    [JsonPropertyName("stopSequences")]
    public IReadOnlyList<string>? StopSequences { get; set; }
}

public sealed class GeminiGenerateContentRequest
{
    [JsonPropertyName("contents")]
    public IReadOnlyList<GeminiContent> Contents { get; set; } = [];

    [JsonPropertyName("generationConfig")]
    public GeminiGenerationConfig? GenerationConfig { get; set; }
}

public sealed class GeminiContent
{
    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("parts")]
    public IReadOnlyList<GeminiPart> Parts { get; set; } = [];
}

public sealed class GeminiPart
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public sealed class GeminiGenerateContentResponse
{
    [JsonPropertyName("candidates")]
    public IReadOnlyList<GeminiCandidate>? Candidates { get; set; }
}

public sealed class GeminiCandidate
{
    [JsonPropertyName("content")]
    public GeminiContent? Content { get; set; }
}

#endregion
