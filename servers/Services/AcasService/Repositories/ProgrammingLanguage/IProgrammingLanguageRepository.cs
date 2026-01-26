
namespace AcasService.Repositories.ProgrammingLanguage;

public interface IProgrammingLanguageRepository
{
    Task<Models.ProgrammingLanguage?> CreateAsync(Models.ProgrammingLanguage language);

    Task<Models.ProgrammingLanguage?> GetByIdAsync(string id);

    Task<IEnumerable<Models.ProgrammingLanguage>> GetAllAsync();

    Task<Models.ProgrammingLanguage?> UpdateAsync(string id, Models.ProgrammingLanguage language);

    Task DeleteAsync(string id);
    
    Task<Models.ProgrammingLanguage?> ToggleEnableAsync(string id);
    
    Task<IEnumerable<Models.ProgrammingLanguage>> SearchAsync(string? searchTerm = null, bool? isEnable = null);
    
    Task<Models.ProgrammingLanguage?> GetByKeyAsync(string key);
    
    Task<(IEnumerable<Models.ProgrammingLanguage> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, string? sortBy = null, bool ascending = true);

}

