namespace AcasService.Repositories.Subject;

public interface ISubjectRepository
{
    Task<Models.Subject?> CreateAsync(Models.Subject subject);
    Task<Models.Subject?> FindByIdAsync(string subjectId);
    Task<List<Models.Subject>> FindAllAsync(); 
    Task<Models.Subject?> UpdateAsync(Models.Subject subject);
    Task DeleteAsync(string subjectId);
    
    // Soft Delete & Restore
    Task<Models.Subject?> SoftDeleteAsync(string subjectId);
    Task<Models.Subject?> RestoreAsync(string subjectId);
    
    // Search & Filter
    Task<List<Models.Subject>> SearchAsync(
        string? searchTerm = null, 
        bool? isDeleted = null, 
        string? createdBy = null);
    
    // Validation
    Task<Models.Subject?> GetBySubjectCodeAsync(string subjectCode);
    Task<bool> IsSubjectCodeExistsAsync(string subjectCode, string? excludeId = null);
    
    // Pagination
    Task<(List<Models.Subject> Items, int TotalCount)> GetPagedAsync(
        int page, 
        int pageSize, 
        string? sortBy = null, 
        bool ascending = true,
        bool? includeDeleted = false);
    
    // Bulk Operations
    Task<int> BulkSoftDeleteAsync(List<string> subjectIds);
    Task<int> BulkRestoreAsync(List<string> subjectIds);
}