using AcasService.Application.Requests.ProgrammingLanguage;
using AcasService.Repositories.ProgrammingLanguage;
using Microsoft.Extensions.Logging;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;

namespace AcasService.Application.Commands.ProgrammingLanguage;



public interface IProgrammingLanguageCommand
{
    Task<ProgrammingLanguageResponse> CreateAsync(ProgrammingLanguageRequest request);

    Task<ProgrammingLanguageResponse> UpdateAsync(string id, ProgrammingLanguageRequest request);

    Task DeleteAsync(string id);
    
    Task<ProgrammingLanguageResponse> ToggleEnableAsync(string id);
}

public class ProgrammingLanguageCommand : IProgrammingLanguageCommand
{
    private readonly IProgrammingLanguageRepository _repository;
    private readonly ILogger<ProgrammingLanguageCommand> _logger;

    private readonly ProgrammingLanguageMapper _programmingLanguageMapper;

    public ProgrammingLanguageCommand(IProgrammingLanguageRepository repository,ILogger<ProgrammingLanguageCommand> logger, ProgrammingLanguageMapper programmingLanguageMapper)
    {
        _repository = repository;
        _logger = logger;
        _programmingLanguageMapper = programmingLanguageMapper;
    }

      public async Task<ProgrammingLanguageResponse> CreateAsync(
        ProgrammingLanguageRequest request)
    {
        try
        {
            // Validate if key already exists
            var existingLanguage = await _repository.GetByKeyAsync(request.Key);
            if (existingLanguage != null)
            {
                throw new InvalidOperationException($"Programming language with key '{request.Key}' already exists");
            }

            var entity = _programmingLanguageMapper.ToProgrammingLanguageModel(request);
            var created = await _repository.CreateAsync(entity);
            return _programmingLanguageMapper.ToProgrammingLanguageResponse(created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating programming language");
            throw;
        }
    }


    public async Task<ProgrammingLanguageResponse> UpdateAsync(string id,ProgrammingLanguageRequest request)
    {
        try
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null)
                throw new KeyNotFoundException("ProgrammingLanguage not found");
            existing.LanguageName = request.LanguageName;
            existing.Key = request.Key;
            existing.LanguageVersion = request.LanguageVersion;

            await _repository.UpdateAsync(id,existing);

            return _programmingLanguageMapper.ToProgrammingLanguageResponse(existing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,"Error updating programming language: {Id}", id);
            throw;
        }
    }




    public async Task DeleteAsync(string id)
    {
        try
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null)
                throw new KeyNotFoundException("ProgrammingLanguage not found");
            await _repository.DeleteAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,"Error deleting programming language: {Id}", id);
            throw;
        }
    }

    public async Task<ProgrammingLanguageResponse> ToggleEnableAsync(string id)
    {
        try
        {
            var result = await _repository.ToggleEnableAsync(id);
            if (result == null)
                throw new KeyNotFoundException("ProgrammingLanguage not found");
            
            return _programmingLanguageMapper.ToProgrammingLanguageResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling enable status for programming language: {Id}", id);
            throw;
        }
    }
}