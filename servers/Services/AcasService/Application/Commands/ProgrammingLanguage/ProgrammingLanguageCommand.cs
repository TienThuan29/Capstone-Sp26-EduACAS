using AcasService.Web.Requests;
using AcasService.Repositories.ProgrammingLanguage;
using Microsoft.Extensions.Logging;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.CodeRunner;
using AcasService.Models;
using Microsoft.Extensions.Configuration;

namespace AcasService.Application.Commands.ProgrammingLanguage;



public interface IProgrammingLanguageCommand
{
    Task<List<ProgrammingLanguageResponse>> SyncProgrammingLanguagesAsync();

    Task<ProgrammingLanguageResponse> UpdateStatusAsync(string id, string status);

    Task<ProgrammingLanguageResponse> UpdateLogoUrlAsync(string id, string logoFileUrl);

    Task<ProgrammingLanguageResponse> UpdateCompilerNameAsync(string languageId, string compilerId, string name);
}

public class ProgrammingLanguageCommand : IProgrammingLanguageCommand
{
    private readonly IProgrammingLanguageRepository _repository;
    private readonly ICodeRunnerService _codeRunnerService;
    private readonly ILogger<ProgrammingLanguageCommand> _logger;
    private readonly ProgrammingLanguageMapper _programmingLanguageMapper;

    public ProgrammingLanguageCommand(
        IProgrammingLanguageRepository repository,
        ICodeRunnerService codeRunnerService,
        ILogger<ProgrammingLanguageCommand> logger,
        ProgrammingLanguageMapper programmingLanguageMapper,
        IConfiguration configuration)
    {
        _repository = repository;
        _codeRunnerService = codeRunnerService;
        _logger = logger;
        _programmingLanguageMapper = programmingLanguageMapper;
    }

    public async Task<List<ProgrammingLanguageResponse>> SyncProgrammingLanguagesAsync()
    {
        try
        {
            var languagesTask = _codeRunnerService.GetLanguagesAsync();
            var compilersTask = _codeRunnerService.GetCompilersAsync();
            await Task.WhenAll(languagesTask, compilersTask);

            var externalLanguages = await languagesTask;
            var externalCompilers = await compilersTask;

            _logger.LogInformation("Fetched {LanguageCount} languages and {CompilerCount} compiler groups",
                externalLanguages.Count, externalCompilers.Count);

            // Get existing languages from database
            var existingLanguages = (await _repository.GetAllAsync()).ToList();
            var existingLanguageIds = existingLanguages.ToDictionary(lang => lang.Id, lang => lang);

            var syncedLanguages = new List<ProgrammingLanguageResponse>();

            foreach (var externalLang in externalLanguages)
            {
                // Build the programming language model
                var language = new Models.ProgrammingLanguage
                {
                    Id = externalLang.Id,
                    Name = externalLang.Name,
                    Monaco = externalLang.Monaco ?? string.Empty,
                    Extensions = externalLang.Extensions ?? new List<string>(),
                    LogoFileUrl = string.Empty,
                    Formatter = externalLang.Formatter ?? string.Empty,
                    DigitSeparator = externalLang.DigitSeparator ?? string.Empty,
                    Compilers = new List<Compiler>()
                };

                // Match compilers to language by language ID
                if (externalCompilers.TryGetValue(externalLang.Id, out var langCompilers))
                {
                    language.Compilers = langCompilers.Select(c => new Compiler
                    {
                        Id = c.Id,
                        Name = c.Name ?? string.Empty,
                        Group = c.Group,
                        StdVersions = c.StdVersions ?? new List<string>()
                    }).ToList();
                }

                // if language exists, update or create
                if (existingLanguageIds.TryGetValue(externalLang.Id, out var existingLang))
                {
                    // Preserve status from existing record
                    language.Status = existingLang.Status;
                    language.CreatedDate = existingLang.CreatedDate;

                    var updated = await _repository.UpdateAsync(externalLang.Id, language);
                    if (updated != null)
                    {
                        syncedLanguages.Add(_programmingLanguageMapper.ToProgrammingLanguageResponse(updated));
                        _logger.LogDebug("Updated language: {LanguageId}", externalLang.Id);
                    }
                }
                else
                {
                    // New language - set default status
                    language.Status = PLStatus.DISABLE;

                    var created = await _repository.CreateAsync(language);
                    if (created != null)
                    {
                        syncedLanguages.Add(_programmingLanguageMapper.ToProgrammingLanguageResponse(created));
                        _logger.LogDebug("Created new language: {LanguageId}", externalLang.Id);
                    }
                }
            }

            _logger.LogInformation("Sync completed. Total synced: {Count}", syncedLanguages.Count);

            return syncedLanguages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing programming languages");
            throw;
        }
    }

    public async Task<ProgrammingLanguageResponse> UpdateLogoUrlAsync(string id, string logoFileUrl)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Programming language with ID '{id}' not found");
        }

        existing.LogoFileUrl = logoFileUrl;
        existing.UpdatedDate = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(id, existing);
        _logger.LogInformation("Updated logo URL for language: {LanguageId}", id);

        return _programmingLanguageMapper.ToProgrammingLanguageResponse(updated!);
    }

    public async Task<ProgrammingLanguageResponse> UpdateStatusAsync(string id, string status)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Programming language with ID '{id}' not found");
        }

        if (!Enum.TryParse<PLStatus>(status, true, out var parsedStatus))
        {
            throw new ArgumentException($"Invalid status value: '{status}'. Valid values are: {string.Join(", ", Enum.GetNames<PLStatus>())}");
        }

        existing.Status = parsedStatus;
        existing.UpdatedDate = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(id, existing);
        _logger.LogInformation("Updated status for language: {LanguageId} to {Status}", id, status);

        return _programmingLanguageMapper.ToProgrammingLanguageResponse(updated!);
    }

    public async Task<ProgrammingLanguageResponse> UpdateCompilerNameAsync(string languageId, string compilerId, string name)
    {
        var existing = await _repository.GetByIdAsync(languageId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Programming language with ID '{languageId}' not found");
        }

        var compiler = existing.Compilers?.FirstOrDefault(c => string.Equals(c.Id, compilerId, StringComparison.OrdinalIgnoreCase));
        if (compiler == null)
        {
            throw new KeyNotFoundException($"Compiler with ID '{compilerId}' not found in language '{languageId}'");
        }

        compiler.Name = name ?? string.Empty;
        existing.UpdatedDate = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(languageId, existing);
        _logger.LogInformation("Updated compiler name for language: {LanguageId}, compiler: {CompilerId}", languageId, compilerId);

        return _programmingLanguageMapper.ToProgrammingLanguageResponse(updated!);
    }
}