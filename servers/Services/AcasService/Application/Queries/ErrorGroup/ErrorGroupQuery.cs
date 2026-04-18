using AcasService.Models;
using AcasService.Repositories.ErrorGroup;

namespace AcasService.Application.Queries.ErrorGroup;

public interface IErrorGroupQuery
{
    Task<Models.ErrorGroup?> GetByIdAsync(string id);
    Task<List<Models.ErrorGroup>> GetByProblemIdAsync(string examId, string problemId);
    Task<List<Models.ErrorGroup>> GetByExamIdAsync(string examId);
}

public class ErrorGroupQuery : IErrorGroupQuery
{
    private readonly IErrorGroupRepository _errorGroupRepository;
    private readonly ILogger<ErrorGroupQuery> _logger;

    public ErrorGroupQuery(
        IErrorGroupRepository errorGroupRepository,
        ILogger<ErrorGroupQuery> logger)
    {
        _errorGroupRepository = errorGroupRepository;
        _logger = logger;
    }

    public async Task<Models.ErrorGroup?> GetByIdAsync(string id)
    {
        try
        {
            return await _errorGroupRepository.GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting error group with ID {ErrorGroupId}", id);
            throw;
        }
    }

    public async Task<List<Models.ErrorGroup>> GetByProblemIdAsync(string examId, string problemId)
    {
        try
        {
            return await _errorGroupRepository.GetByProblemIdAsync(examId, problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting error groups for exam {ExamId}, problem {ProblemId}", examId, problemId);
            throw;
        }
    }

    public async Task<List<Models.ErrorGroup>> GetByExamIdAsync(string examId)
    {
        try
        {
            return await _errorGroupRepository.GetByExamIdAsync(examId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting error groups for exam {ExamId}", examId);
            throw;
        }
    }
}