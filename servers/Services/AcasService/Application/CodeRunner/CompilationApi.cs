using System.Text;
using System.Text.Json;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Web.Requests;

namespace AcasService.Application.CodeRunner;

public interface ICompilationApi
{
    Task<CompilationResult> CompileAsync(
        string compilerId,
        CompileRequest compileRequest,
        string lang
    );

    Task<RunBatchResponse> RunBatchAsync(
        string compilerId,
        RumBatchRequest runBatchRequest,
        string lang
    );
}

public class CompilationApi : ICompilationApi
{
    private static readonly HashSet<string> CppLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "c", "cpp", "c++"
    };

    private readonly HttpClient _httpClient;
    private readonly ILogger<CompilationApi> _logger;
    private readonly string _baseUrl;
    private readonly JsonSerializerOptions _jsonOptions;

    public CompilationApi(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<CompilationApi> logger)
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

    private void EnsureNoColorDiagnosticsFlag(string lang, CompileOptions? options)
    {
        if (options == null)
            return;

        if (!CppLanguages.Contains(lang))
            return;

        var existing = options.UserArguments ?? "";
        if (existing.Contains("-fdiagnostics-color", StringComparison.OrdinalIgnoreCase))
            return;

        options.UserArguments = string.IsNullOrWhiteSpace(existing)
            ? "-fdiagnostics-color=never"
            : $"{existing.TrimEnd()} -fdiagnostics-color=never";
    }

    public async Task<CompilationResult> CompileAsync(
        string compilerId,
        CompileRequest compileRequest,
        string lang)
    {
        try
        {
            // Use lang from query parameter if provided, otherwise use from request body
            var language = lang ?? compileRequest.Lang;
            if (string.IsNullOrWhiteSpace(language))
            {
                throw new ArgumentException("Language is required. Provide it either in the request body or as a query parameter.");
            }

            EnsureNoColorDiagnosticsFlag(language, compileRequest.Options);
            var urlBuilder = new StringBuilder($"{_baseUrl}/api/compiler/{compilerId}/compile");
            if (!string.IsNullOrWhiteSpace(lang))
            {
                urlBuilder.Append($"?lang={Uri.EscapeDataString(lang)}");
            }

            var url = urlBuilder.ToString();
            // Serialize request body
            var jsonContent = JsonSerializer.Serialize(compileRequest, _jsonOptions);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            // _logger.LogInformation(
            //     "Calling code-runner compile API: CompilerId={CompilerId}, Language={Language}, Url={Url}",
            //     compilerId, language, url);
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            // Deserialize response
            var responseContent = await response.Content.ReadAsStringAsync();
            var compilationResult = JsonSerializer.Deserialize<CompilationResult>(responseContent, _jsonOptions);

            if (compilationResult == null)
            {
                throw new InvalidOperationException("Failed to deserialize compilation result from code-runner service");
            }

            if (compilationResult.ExecResult == null && responseContent.Contains("\"execResult\"", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    using var doc = JsonDocument.Parse(responseContent);
                    if (doc.RootElement.TryGetProperty("execResult", out var execResultElement))
                    {
                        compilationResult.ExecResult = JsonSerializer.Deserialize<CompilationResult>(execResultElement.GetRawText(), _jsonOptions);
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "JSON deserialization error from code-runner compile API: CompilerId={CompilerId}", compilerId);
                    throw;
                }
            }

            _logger.LogInformation(
                "Compilation completed successfully: CompilerId={CompilerId}, Code={Code}, TimedOut={TimedOut}",
                compilerId, compilationResult.Code, compilationResult.TimedOut);

            return compilationResult;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error calling code-runner compile API: CompilerId={CompilerId}", compilerId);
            throw;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error from code-runner compile API: CompilerId={CompilerId}", compilerId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling code-runner compile API: CompilerId={CompilerId}", compilerId);
            throw;
        }
    }


    public async Task<RunBatchResponse> RunBatchAsync(
        string compilerId,
        RumBatchRequest runBatchRequest,
        string? lang = null)
    {
        try
        {
            // Use lang from query parameter if provided, otherwise use from request body
            var language = lang ?? runBatchRequest.Lang;
            if (string.IsNullOrWhiteSpace(language))
            {
                throw new ArgumentException("Language is required. Provide it either in the request body or as a query parameter.");
            }

            EnsureNoColorDiagnosticsFlag(language, runBatchRequest.Options);

            if (runBatchRequest.StdinList == null || runBatchRequest.StdinList.Count == 0)
            {
                throw new ArgumentException("stdinList must contain at least one input.");
            }

            // Build URL with optional lang query parameter
            var urlBuilder = new StringBuilder($"{_baseUrl}/api/compiler/{compilerId}/run-batch");
            if (!string.IsNullOrWhiteSpace(lang))
            {
                urlBuilder.Append($"?lang={Uri.EscapeDataString(lang)}");
            }

            var url = urlBuilder.ToString();

            // Serialize request body
            var jsonContent = JsonSerializer.Serialize(runBatchRequest, _jsonOptions);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            _logger.LogInformation(
                "Calling code-runner run-batch API: CompilerId={CompilerId}, Language={Language}, Url={Url}, Inputs={InputCount}",
                compilerId, language, url, runBatchRequest.StdinList.Count);

            // Make POST request
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            // Deserialize response
            var responseContent = await response.Content.ReadAsStringAsync();
            var runBatchResponse = JsonSerializer.Deserialize<RunBatchResponse>(responseContent, _jsonOptions);

            if (runBatchResponse == null)
            {
                throw new InvalidOperationException("Failed to deserialize run-batch result from code-runner service");
            }

            _logger.LogInformation(
                "Run-batch completed successfully: CompilerId={CompilerId}, Code={Code}, TimedOut={TimedOut}, ExecCount={ExecCount}",
                compilerId, runBatchResponse.Code, runBatchResponse.TimedOut, runBatchResponse.ExecResults.Count);

            return runBatchResponse;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error calling code-runner run-batch API: CompilerId={CompilerId}", compilerId);
            throw;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error from code-runner run-batch API: CompilerId={CompilerId}", compilerId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling code-runner run-batch API: CompilerId={CompilerId}", compilerId);
            throw;
        }
    }
}
