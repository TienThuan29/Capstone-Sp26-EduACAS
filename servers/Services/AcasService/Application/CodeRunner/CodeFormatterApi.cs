using System.Text;
using System.Text.Json;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Web.Requests;

namespace AcasService.Application.CodeRunner;

public interface ICodeFormatterApi
{
    Task<FormatCodeResponse> FormatCodeAsync(string lang, FormatCodeRequest request);
}

public class CodeFormatterApi : ICodeFormatterApi
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CodeFormatterApi> _logger;
    private readonly string _baseUrl;
    private readonly JsonSerializerOptions _jsonOptions;

    public CodeFormatterApi(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<CodeFormatterApi> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = configuration["CodeRunner:BaseUrl"]
            ?? throw new ArgumentNullException("CodeRunner:BaseUrl is not configured");

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            MaxDepth = 128
        };
    }

    public async Task<FormatCodeResponse> FormatCodeAsync(string lang, FormatCodeRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(lang))
            {
                throw new ArgumentException("Language is required for code formatting.");
            }

            if (string.IsNullOrWhiteSpace(request.Source))
            {
                throw new ArgumentException("Source code is required for formatting.");
            }

            var url = $"{_baseUrl}/api/format?lang={Uri.EscapeDataString(lang)}";

            var jsonContent = JsonSerializer.Serialize(request, _jsonOptions);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            _logger.LogInformation(
                "Calling code-runner format API: Language={Language}, Url={Url}, SourceLength={SourceLength}",
                lang, url, request.Source.Length);

            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var formatResponse = JsonSerializer.Deserialize<FormatCodeResponse>(responseContent, _jsonOptions);

            if (formatResponse == null)
            {
                throw new InvalidOperationException("Failed to deserialize format result from code-runner service");
            }

            _logger.LogInformation(
                "Code formatting completed: Language={Language}, Code={Code}, FormattedLength={FormattedLength}",
                lang, formatResponse.Code, formatResponse.Formatted?.Length ?? 0);

            return formatResponse;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error calling code-runner format API: Language={Language}", lang);
            throw;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error from code-runner format API: Language={Language}", lang);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling code-runner format API: Language={Language}", lang);
            throw;
        }
    }
}
