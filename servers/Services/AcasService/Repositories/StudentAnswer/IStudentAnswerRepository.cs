namespace AcasService.Repositories.StudentAnswer;

public interface IStudentAnswerRepository
{
    Task<Models.StudentAnswer?> CreateAsync(Models.StudentAnswer studentAnswer);
    Task<Models.StudentAnswer?> FindByIdAsync(string studentAnswerId);
    Task<List<Models.StudentAnswer>> FindByAttemptIdAsync(string attemptId);
    Task<Models.StudentAnswer?> UpdateAsync(Models.StudentAnswer studentAnswer);
    Task DeleteAsync(string studentAnswerId);
}
