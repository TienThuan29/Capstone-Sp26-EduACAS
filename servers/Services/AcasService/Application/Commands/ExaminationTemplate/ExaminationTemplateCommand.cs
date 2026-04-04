using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Application.Mappers;
using AcasService.Repositories.ExaminationTemplate;

namespace AcasService.Application.Commands.ExaminationTemplate;

public interface IExaminationTemplateCommand
{
    Task<ExaminationTemplateResponse?> CreateAsync(ExaminationTemplateRequest request);
    Task<ExaminationTemplateResponse?> UpdateAsync(string id, UpdateExaminationTemplateRequest request);
    Task DeleteAsync(string id);
    Task<ExaminationTemplateResponse?> SoftDeleteAsync(string id);
    Task<ExaminationTemplateResponse?> RestoreAsync(string id);
}

public class ExaminationTemplateCommand : IExaminationTemplateCommand
{
    private readonly IExaminationTemplateRepository _repository;
    private readonly ExaminationTemplateMapper _mapper;
    private readonly ILogger<ExaminationTemplateCommand> _logger;

    public ExaminationTemplateCommand(
        IExaminationTemplateRepository repository,
        ILogger<ExaminationTemplateCommand> logger)
    {
        _repository = repository;
        _mapper = new ExaminationTemplateMapper();
        _logger = logger;
    }

    public async Task<ExaminationTemplateResponse?> CreateAsync(ExaminationTemplateRequest request)
    {
        try
        {
            var model = _mapper.ToExaminationTemplateModel(request);
            var created = await _repository.CreateAsync(model);
            return created != null ? _mapper.ToExaminationTemplateResponse(created) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating examination template");
            throw;
        }
    }

    public async Task<ExaminationTemplateResponse?> UpdateAsync(string id, UpdateExaminationTemplateRequest request)
    {
        try
        {
            var existing = await _repository.FindByIdAsync(id);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Examination template with id '{id}' not found.");
            }

            _mapper.UpdateExaminationTemplateModel(existing, request);
            var updated = await _repository.UpdateAsync(existing);
            return updated != null ? _mapper.ToExaminationTemplateResponse(updated) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating examination template {Id}", id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var existing = await _repository.FindByIdAsync(id);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Examination template with id '{id}' not found.");
            }

            await _repository.DeleteAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting examination template {Id}", id);
            throw;
        }
    }

    public async Task<ExaminationTemplateResponse?> SoftDeleteAsync(string id)
    {
        try
        {
            var updated = await _repository.SoftDeleteAsync(id);
            return updated != null ? _mapper.ToExaminationTemplateResponse(updated) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft-deleting examination template {Id}", id);
            throw;
        }
    }

    public async Task<ExaminationTemplateResponse?> RestoreAsync(string id)
    {
        try
        {
            var updated = await _repository.RestoreAsync(id);
            return updated != null ? _mapper.ToExaminationTemplateResponse(updated) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring examination template {Id}", id);
            throw;
        }
    }
}
