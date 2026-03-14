namespace AcasService.Repositories.ClassroomEnrollment;

public interface IClassroomEnrollmentRepository
{
    Task<Models.ClassEnrollment?> CreateAsync(Models.ClassEnrollment enrollment);
    Task<Models.ClassEnrollment?> FindByIdAsync(string enrollmentId);
    Task<List<Models.ClassEnrollment>> FindByAllAsync();

    Task<Models.ClassEnrollment?> UpdateAsync(Models.ClassEnrollment enrollment); 

    Task DeleteAsync(string enrollmentId);

    Task<List<Models.ClassEnrollment>> FindByStudentIdAsync(string studentId);
    
    Task<Models.ClassEnrollment?> FindByClassAndStudentIdAsync(string classId, string studentId);
    Task<Dictionary<string, Models.ClassEnrollment?>> FindByClassIdsAndStudentIdAsync(IEnumerable<string> classIds, string studentId);

    Task<List<Models.ClassEnrollment>> FindByClassIdAsync(string classId);
}