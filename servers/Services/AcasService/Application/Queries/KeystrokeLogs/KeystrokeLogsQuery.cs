using AcasService.Models;
using AcasService.Repositories.KeystrokeLogs;

namespace AcasService.Application.Queries.KeystrokeLogs;

public interface IKeystrokeLogsQuery
{
    Task<List<KeystrokeLog>> GetBySubmissionIdAsync(string submissionId);
}

public class KeystrokeLogsQuery : IKeystrokeLogsQuery
{
    private readonly IKeystrokeLogRepository _keystrokeLogRepository;

    public KeystrokeLogsQuery(IKeystrokeLogRepository keystrokeLogRepository)
    {
        _keystrokeLogRepository = keystrokeLogRepository;
    }

    public Task<List<KeystrokeLog>> GetBySubmissionIdAsync(string submissionId)
    {
        return _keystrokeLogRepository.GetBySubmissionIdAsync(submissionId);
    }
}
