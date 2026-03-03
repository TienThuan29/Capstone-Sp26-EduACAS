
namespace AcasService.Repositories.Examination;

public interface IExaminationRepository
{
    Task<Models.Examination?> GetByIdAsync(string id);
    Task<List<Models.Examination>> GetByIdsAsync(IEnumerable<string> ids);
    Task<List<Models.Examination?>> GetAllAsync();
    Task<Models.Examination?> CreateAsync(Models.Examination exam);
    Task<Models.Examination?> UpdateAsync(string id,Models.Examination exam);
    Task DeleteAsync(string id);

    Task<List<Models.Examination>> GetByClassIdAsync(string classId);
}