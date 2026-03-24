namespace AcasService.Repositories.KeystrokeLogs;

public interface IKeystrokeLogRepository
{
    Task<Models.KeystrokeLog?> CreateAsync(Models.KeystrokeLog keystrokeLog);

    Task<List<Models.KeystrokeLog>> GetBySubmissionIdAsync(string submissionId);
}
