namespace AcasService.Repositories.Submission;

public interface ISubmissionRepository
{
    Task<Models.Submission?> CreateAsync(Models.Submission submission);
    Task<Models.Submission?> GetByIdAsync(string id);
    Task<Models.Submission?> UpdateAsync(Models.Submission submission);
    Task DeleteAsync(string id);
    Task<List<Models.Submission>> GetByStudentIdAsync(string studentId);
    Task<List<Models.Submission>> GetByStudentIdsAsync(List<string> studentIds);
    Task<List<Models.Submission>> GetByExamIdAsync(string examId);
    Task<List<Models.Submission>> GetByExamIdsAsync(List<string> examIds);
    Task<List<Models.Submission>> GetByProblemIdAsync(string problemId);

    Task<List<Models.Submission>> GetLatestVersionSubmissionsOfProblemInExam(string examId, string problemId);
    Task<List<Models.Submission>> GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(string examId, string problemId);

    Task<Dictionary<string, List<Models.Submission>>> GetLatestVersionSubmissionsByExamAsync(string examId, string? studentId = null);

    Task<List<Models.Submission>> GetVersionsBySubmissionKey(string studentId, string examId, string problemId);
    Task<List<Models.Submission>> GetAllAsync();
}