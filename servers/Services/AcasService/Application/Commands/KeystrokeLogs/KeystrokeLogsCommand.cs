using AcasService.Application.ResponseDTOs;
using AcasService.Application.Mappers;
using AcasService.Models;
using AcasService.Repositories.Caching.Redis.KeystrokeLogs;
using AcasService.Repositories.KeystrokeLogs;
using AcasService.Repositories.Submission;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.KeystrokeLogs;

public interface IKeystrokeLogsCommand
{
    Task<CacheKeystrokeLogsResponse> CacheKeystrokeLogsAsync(CacheKeystrokeLogsRequest request);

    Task<FlushKeystrokeLogsResponse> FlushKeystrokeLogsAsync(FlushKeystrokeLogsRequest request);
}

public class KeystrokeLogsCommand : IKeystrokeLogsCommand
{
    private readonly IKeystrokeLogsCache _keystrokeLogsCache;
    private readonly IKeystrokeLogRepository _keystrokeLogRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly KeystrokeLogsMapper _keystrokeLogsMapper;
    private readonly ILogger<KeystrokeLogsCommand> _logger;

    public KeystrokeLogsCommand(
        IKeystrokeLogsCache keystrokeLogsCache,
        IKeystrokeLogRepository keystrokeLogRepository,
        ISubmissionRepository submissionRepository,
        KeystrokeLogsMapper keystrokeLogsMapper,
        ILogger<KeystrokeLogsCommand> logger)
    {
        _keystrokeLogsCache = keystrokeLogsCache;
        _keystrokeLogRepository = keystrokeLogRepository;
        _submissionRepository = submissionRepository;
        _keystrokeLogsMapper = keystrokeLogsMapper;
        _logger = logger;
    }

    public async Task<CacheKeystrokeLogsResponse> CacheKeystrokeLogsAsync(CacheKeystrokeLogsRequest request)
    {
        var key = _keystrokeLogsCache.GetCacheKey(request.ExaminationId, request.StudentId, request.ProblemId);
        var records = SanitizeRecords(await _keystrokeLogsCache.GetAsync<List<KeystrokeRecord>>(key).ConfigureAwait(false)
            ?? new List<KeystrokeRecord>());

        records.AddRange(SanitizeRecords(request.KeystrokeData));

        await _keystrokeLogsCache.SetAsync(key, records).ConfigureAwait(false);

        _logger.LogInformation(
            "Cached {Count} records for {StudentId}/{ExamId}/{ProblemId}. Total in Redis: {Total}",
            request.KeystrokeData.Count,
            request.StudentId,
            request.ExaminationId,
            request.ProblemId,
            records.Count);

        return _keystrokeLogsMapper.ToCacheResponse(request, records);
    }

    public async Task<FlushKeystrokeLogsResponse> FlushKeystrokeLogsAsync(FlushKeystrokeLogsRequest request)
    {
        var submission = await _submissionRepository.GetByIdAsync(request.SubmissionId).ConfigureAwait(false);
        if (submission == null)
        {
            throw new ArgumentException($"Submission '{request.SubmissionId}' does not exist.");
        }

        if (!string.Equals(submission.StudentId, request.StudentId, StringComparison.Ordinal) ||
            !string.Equals(submission.ExamId, request.ExaminationId, StringComparison.Ordinal) ||
            !string.Equals(submission.ProblemId, request.ProblemId, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                "Submission does not match examinationId/studentId/problemId in keystroke flush request.");
        }

        var key = _keystrokeLogsCache.GetCacheKey(request.ExaminationId, request.StudentId, request.ProblemId);
        var allRecords = SanitizeRecords(await _keystrokeLogsCache.GetAsync<List<KeystrokeRecord>>(key).ConfigureAwait(false)
            ?? new List<KeystrokeRecord>());

        allRecords.AddRange(SanitizeRecords(request.KeystrokeData));

        if (allRecords.Count == 0)
            return _keystrokeLogsMapper.ToEmptyFlushResponse(request);

        var finalLog = _keystrokeLogsMapper.ToEntity(request, allRecords);

        var saved = await _keystrokeLogRepository.CreateAsync(finalLog).ConfigureAwait(false);
        if (saved == null)
            throw new InvalidOperationException("Failed to persist keystroke log to database.");

        await _keystrokeLogsCache.RemoveAsync(key).ConfigureAwait(false);

        _logger.LogInformation(
            "Flushed {Count} records to DB for submission {SubmissionId} ({ExamId}/{StudentId}/{ProblemId})",
            allRecords.Count,
            request.SubmissionId,
            request.ExaminationId,
            request.StudentId,
            request.ProblemId);

        return _keystrokeLogsMapper.ToFlushResponse(request, saved, allRecords);
    }

    private static List<KeystrokeRecord> SanitizeRecords(IEnumerable<KeystrokeRecord>? records)
    {
        if (records == null)
            return new List<KeystrokeRecord>();

        return records
            .Where(IsValidRecord)
            .ToList();
    }

    private static bool IsValidRecord(KeystrokeRecord? record)
    {
        if (record == null)
            return false;

        return !string.IsNullOrWhiteSpace(record.TimeStartSet)
            && !string.IsNullOrWhiteSpace(record.TimeOffSet)
            && record.Duration > 0
            && record.Cps > 0
            && record.CharCount > 0;
    }
}
