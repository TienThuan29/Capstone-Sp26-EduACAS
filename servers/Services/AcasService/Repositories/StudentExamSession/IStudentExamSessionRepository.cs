namespace AcasService.Repositories.StudentExamSession;

public interface IStudentExamSessionRepository
{
    Task<Models.StudentExamSession?> GetByStudentAndExamAsync(string studentId, string examId);
    Task<Models.StudentExamSession?> UpsertAsync(Models.StudentExamSession session);
    /// <summary>Finds session with Phase == Active for this student (scan; use GSI in production if needed).</summary>
    Task<Models.StudentExamSession?> FindActiveByStudentAsync(string studentId);
}
