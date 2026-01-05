namespace AcasService.Repositories.Subject;

public interface ISubjectRepository
{
    Task<Models.Subject?> CreateAsync(Models.Subject subject);
    Task<Models.Subject?> FindByIdAsync(string subjectId);
    Task<List<Models.Subject>> FindAllAsync();
    Task<Models.Subject?> UpdateAsync(Models.Subject subject);
    Task DeleteAsync(string subjectId);
}