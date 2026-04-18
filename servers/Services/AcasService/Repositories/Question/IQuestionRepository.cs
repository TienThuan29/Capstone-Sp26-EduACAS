using AcasService.Application.ResponseDTOs;

namespace AcasService.Repositories.Question;

public interface IQuestionRepository
{
    Task<Models.Question?> CreateAsync(Models.Question question);
    Task<Models.Question?> FindByIdAsync(string questionId);
    Task<Dictionary<string, Models.Question>> FindByIdsAsync(IEnumerable<string> questionIds);
    Task<List<Models.Question>> FindAllAsync(bool includeDeleted = false);
    Task<PagedResult<Models.Question>> FindAllPagedAsync(
        int pageIndex,
        int pageSize,
        bool includeDeleted = false,
        string? searchTerm = null,
        string? type = null);
    Task<Models.Question?> UpdateAsync(Models.Question question);
    Task SoftDeleteAsync(string questionId);
    Task DeleteAsync(string questionId);
}
