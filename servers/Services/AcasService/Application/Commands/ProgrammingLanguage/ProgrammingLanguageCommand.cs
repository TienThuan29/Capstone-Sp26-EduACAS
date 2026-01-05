using AcasService.Application.Requests.ProgrammingLanguage;
using AcasService.Application.Responses.ProgrammingLanguage;
using AcasService.Repositories.ProgrammingLanguage;
using Microsoft.Extensions.Logging;
using AcasService.Application.Mappers;

namespace AcasService.Application.Commands.ProgrammingLanguage;



public interface IProgrammingLanguageCommand
{
    Task<ProgrammingLanguageResponse> CreateAsync(ProgrammingLanguageRequest request);

    Task<ProgrammingLanguageResponse> UpdateAsync(string id, ProgrammingLanguageRequest request);

    Task DeleteAsync(string id);
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
}