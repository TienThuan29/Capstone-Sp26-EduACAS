using AcasService.Models;

namespace AcasService.Repositories.ErrorGroup;

public interface IErrorGroupRepository
{
    Task<Models.ErrorGroup?> CreateAsync(Models.ErrorGroup errorGroup);
    Task<Models.ErrorGroup?> GetByIdAsync(string id);
    Task<List<Models.ErrorGroup>> GetByProblemIdAsync(string examId, string problemId);
    Task<List<Models.ErrorGroup>> GetByProblemIdPaginatedAsync(string examId, string problemId);
    Task<List<Models.ErrorGroup>> GetByExamIdAsync(string examId);
    Task DeleteByProblemIdAsync(string examId, string problemId);
    Task DeleteByProblemIdPaginatedAsync(string examId, string problemId);
    Task<Models.ErrorGroup?> UpdateAsync(Models.ErrorGroup errorGroup);
}
