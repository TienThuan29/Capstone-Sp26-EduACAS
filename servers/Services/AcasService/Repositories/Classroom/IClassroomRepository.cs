namespace AcasService.Repositories.Classroom;

public interface IClassroomRepository
{
    Task<Models.Classroom?> CreateAsync(Models.Classroom classroom);
    Task<Models.Classroom?> FindByIdAsync(string classroomId);
    Task<List<Models.Classroom>> FindAllAsync();
    Task<Models.Classroom?> UpdateAsync(Models.Classroom classroom);
    Task DeleteAsync(string classroomId);
}