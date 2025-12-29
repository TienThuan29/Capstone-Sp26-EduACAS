
namespace AcasService.Repositories.ProgrammingLanguage;

public interface IProgrammingLanguageRepository
{
    Task<Models.ProgrammingLanguage?> CreateAsync(Models.ProgrammingLanguage language);

    Task<Models.ProgrammingLanguage?> GetByIdAsync(string id);

    Task<IEnumerable<Models.ProgrammingLanguage>> GetAllAsync();

    Task<Models.ProgrammingLanguage?> UpdateAsync(string id, Models.ProgrammingLanguage language);

    Task DeleteAsync(string id);

}

