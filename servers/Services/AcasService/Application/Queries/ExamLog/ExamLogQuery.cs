using AcasService.Repositories.ExamLog;

namespace AcasService.Application.Queries.ExamLog;

public interface IExamLogQuery
{
    Task<Models.ExamLog?> GetByIdAsync(string id);
    Task<List<Models.ExamLog>> GetBySubmissionIdAsync(string submissionId);
}

public class ExamLogQuery : IExamLogQuery
{
    private readonly IExamLogRepository _examLogRepository;

    public ExamLogQuery(IExamLogRepository examLogRepository)
    {
        _examLogRepository = examLogRepository;
    }

    public Task<Models.ExamLog?> GetByIdAsync(string id) => _examLogRepository.GetByIdAsync(id);

    public Task<List<Models.ExamLog>> GetBySubmissionIdAsync(string submissionId) =>
        _examLogRepository.GetBySubmissionIdAsync(submissionId);
}
