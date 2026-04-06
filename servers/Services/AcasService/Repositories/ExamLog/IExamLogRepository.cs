namespace AcasService.Repositories.ExamLog;

public interface IExamLogRepository
{
    Task<Models.ExamLog?> CreateAsync(Models.ExamLog examLog);
    Task<Models.ExamLog?> GetByIdAsync(string id);
    Task<List<Models.ExamLog>> GetBySubmissionIdAsync(string submissionId);
}
