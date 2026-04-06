using AcasService.Application.ResponseDTOs;
using AcasService.Application.Mappers;
using AcasService.Repositories.ExaminationTemplate;

namespace AcasService.Application.Queries.ExaminationTemplate;

public interface IExaminationTemplateQuery
{
    Task<ExaminationTemplateResponse?> GetByIdAsync(string id);
    Task<PagedResult<ExaminationTemplateResponse>> GetAllAsync(int pageIndex = 1, int pageSize = 10);
    Task<PagedResult<ExaminationTemplateResponse>> GetByLecturerIdAsync(string lecturerId, int pageIndex = 1, int pageSize = 10);
}

public class ExaminationTemplateQuery : IExaminationTemplateQuery
{
    private readonly IExaminationTemplateRepository _repository;
    private readonly ExaminationTemplateMapper _mapper;
    private readonly ILogger<ExaminationTemplateQuery> _logger;

    public ExaminationTemplateQuery(
        IExaminationTemplateRepository repository,
        ILogger<ExaminationTemplateQuery> logger)
    {
        _repository = repository;
        _mapper = new ExaminationTemplateMapper();
        _logger = logger;
    }

    public async Task<ExaminationTemplateResponse?> GetByIdAsync(string id)
    {
        try
        {
            var template = await _repository.FindByIdAsync(id);
            if (template == null)
            {
                _logger.LogWarning("Examination template not found: {Id}", id);
                return null;
            }
            return _mapper.ToExaminationTemplateResponse(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting examination template {Id}", id);
            throw;
        }
    }

    public async Task<PagedResult<ExaminationTemplateResponse>> GetAllAsync(int pageIndex = 1, int pageSize = 10)
    {
        if (pageIndex < 1) pageIndex = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        try
        {
            var templates = await _repository.FindAllAsync();
            var totalCount = templates.Count;
            var items = templates
                .OrderByDescending(t => t.UpdatedDate ?? t.CreatedDate)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .Select(t => _mapper.ToExaminationTemplateResponse(t))
                .ToList();

            return new PagedResult<ExaminationTemplateResponse>(items, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all examination templates");
            throw;
        }
    }

    public async Task<PagedResult<ExaminationTemplateResponse>> GetByLecturerIdAsync(string lecturerId, int pageIndex = 1, int pageSize = 10)
    {
        if (pageIndex < 1) pageIndex = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        try
        {
            var templates = await _repository.GetByLecturerIdAsync(lecturerId);
            var totalCount = templates.Count;
            var items = templates
                .OrderByDescending(t => t.UpdatedDate ?? t.CreatedDate)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .Select(t => _mapper.ToExaminationTemplateResponse(t))
                .ToList();

            return new PagedResult<ExaminationTemplateResponse>(items, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting examination templates for lecturer {LecturerId}", lecturerId);
            throw;
        }
    }
}
