
namespace AcasService.Repositories.Classroom;


public interface IClassroomRepository
{
    Task<Models.Classroom?> CreateAsync(Models.Classroom classroom);
    Task<Models.Classroom?> FindByIdAsync(string classroomId);
    Task<List<Models.Classroom>> FindByIdsAsync(IEnumerable<string> classroomIds);
    Task<List<Models.Classroom>> FindAllAsync();
    Task<Models.Classroom?> UpdateAsync(Models.Classroom classroom);
    Task SoftDeleteAsync(string classroomId);
    Task DeleteAsync(string classroomId);
    Task<IEnumerable<Models.Classroom>> GetClassroomsByKeywordAsync(string keyword);
    Task<Models.Classroom?> FindByEnrollKeyAsync(string enrollKey);
    Task<IEnumerable<Models.Classroom>> GetClassroomsByLecturerIdAsync(string lecturerId);
}