namespace AcasService.Repositories.Material;

public interface IMaterialRepository
{
    Task<Models.Material?> CreateAsync(Models.Material material);
    Task<Models.Material?> FindByIdAsync(string materialId);
    Task<List<Models.Material>> FindAllAsync();
    Task<List<Models.Material>> FindByClassroomIdAsync(string classroomId);
    Task<Models.Material?> UpdateAsync(Models.Material material);
    Task SoftDeleteAsync(string materialId);
    Task DeleteAsync(string materialId);
}