namespace AcasService.Repositories.AcademicWarning;

public interface IAcademicWarningRepository
{
    Task<Models.AcademicWarning?> CreateAsync(Models.AcademicWarning academicWarning);
    Task<Models.AcademicWarning?> FindByIdAsync(string id);
    Task<List<Models.AcademicWarning>> FindByStudentIdAsync(string studentId);
    Task<List<Models.AcademicWarning>> FindByStudentIdsAsync(List<string> studentIds);
    Task<List<Models.AcademicWarning>> FindByClassroomIdAsync(string classroomId);
    Task<List<Models.AcademicWarning>> FindByExamIdAsync(string examId);
    Task<Models.AcademicWarning?> UpdateAsync(Models.AcademicWarning academicWarning);
    Task DeleteAsync(string id);
}
