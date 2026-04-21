using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.AcademicWarning;

namespace AcasService.Application.Queries.AcademicWarning;

public interface IAcademicWarningQuery
{
    Task<List<AcademicWarningResponse>> GetByStudentIdAsync(string studentId);
    Task<List<AcademicWarningResponse>> GetByClassroomIdAsync(string classroomId);
    Task<AcademicWarningResponse?> GetByIdAsync(string id);
}

public class AcademicWarningQuery : IAcademicWarningQuery
{
    private readonly ILogger<AcademicWarningQuery> _logger;
    private readonly IAcademicWarningRepository _repository;

    public AcademicWarningQuery(
        ILogger<AcademicWarningQuery> logger,
        IAcademicWarningRepository repository)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<List<AcademicWarningResponse>> GetByStudentIdAsync(string studentId)
    {
        try
        {
            var warnings = await _repository.FindByStudentIdAsync(studentId);
            return warnings.Select(AcademicWarningMapper.ToResponse).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warnings for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<List<AcademicWarningResponse>> GetByClassroomIdAsync(string classroomId)
    {
        try
        {
            var warnings = await _repository.FindByClassroomIdAsync(classroomId);
            return warnings.Select(AcademicWarningMapper.ToResponse).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warnings for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<AcademicWarningResponse?> GetByIdAsync(string id)
    {
        try
        {
            var warning = await _repository.FindByIdAsync(id);
            return warning != null ? AcademicWarningMapper.ToResponse(warning) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warning {Id}", id);
            throw;
        }
    }
}
