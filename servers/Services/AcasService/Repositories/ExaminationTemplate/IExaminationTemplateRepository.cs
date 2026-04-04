
namespace AcasService.Repositories.ExaminationTemplate;

public interface IExaminationTemplateRepository
{
    Task<Models.ExaminationTemplate?> CreateAsync(Models.ExaminationTemplate template);
    Task<Models.ExaminationTemplate?> FindByIdAsync(string id);
    Task<List<Models.ExaminationTemplate>> FindByIdsAsync(IEnumerable<string> ids);
    Task<List<Models.ExaminationTemplate>> FindAllAsync();
    Task<Models.ExaminationTemplate?> UpdateAsync(Models.ExaminationTemplate template);
    Task DeleteAsync(string id);
    Task<Models.ExaminationTemplate?> SoftDeleteAsync(string id);
    Task<Models.ExaminationTemplate?> RestoreAsync(string id);
    Task<List<Models.ExaminationTemplate>> GetByLecturerIdAsync(string lecturerId);
}
