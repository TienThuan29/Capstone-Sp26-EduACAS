using System.Text.Json;
using AcasService.Application.ResponseDTOs.External;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AcasService.Application.CodeRunner;

public interface ICodeRunnerService
{
    Task<List<CodeRunnerLanguageDto>> GetLanguagesAsync();
    Task<Dictionary<string, List<CodeRunnerCompilerDto>>> GetCompilersAsync();
}

public class CodeRunnerService : ICodeRunnerService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CodeRunnerService> _logger;
    private readonly string _baseUrl;

    public CodeRunnerService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<CodeRunnerService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = configuration["CodeRunner:BaseUrl"] 
            ?? throw new ArgumentNullException("CodeRunner:BaseUrl is not configured");
    }

    public async Task<List<CodeRunnerLanguageDto>> GetLanguagesAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/languages");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var languages = JsonSerializer.Deserialize<List<CodeRunnerLanguageDto>>(content);

            return languages ?? new List<CodeRunnerLanguageDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching languages from code-runner service");
            throw;
        }
    }

    public async Task<Dictionary<string, List<CodeRunnerCompilerDto>>> GetCompilersAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/compilers");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var compilers = JsonSerializer.Deserialize<Dictionary<string, List<CodeRunnerCompilerDto>>>(content);

            return compilers ?? new Dictionary<string, List<CodeRunnerCompilerDto>>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching compilers from code-runner service");
            throw;
        }
    }
}
