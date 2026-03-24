using AcasService.Application.ResponseDTOs;
using AcasService.Application.Mappers;
using AcasService.Models;
using AcasService.Repositories.Caching.Redis.KeystrokeLogs;
using AcasService.Repositories.KeystrokeLogs;
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
    private readonly KeystrokeLogsMapper _keystrokeLogsMapper;
    private readonly ILogger<KeystrokeLogsCommand> _logger;

    public KeystrokeLogsCommand(
        IKeystrokeLogsCache keystrokeLogsCache,
        IKeystrokeLogRepository keystrokeLogRepository,
        KeystrokeLogsMapper keystrokeLogsMapper,
        ILogger<KeystrokeLogsCommand> logger)
    {
        _keystrokeLogsCache = keystrokeLogsCache;
        _keystrokeLogRepository = keystrokeLogRepository;
        _keystrokeLogsMapper = keystrokeLogsMapper;
        _logger = logger;
    }

    public async Task<CacheKeystrokeLogsResponse> CacheKeystrokeLogsAsync(CacheKeystrokeLogsRequest request)
    {
        var key = _keystrokeLogsCache.GetCacheKey(request.ExaminationId, request.StudentId, request.ProblemId);
        var records = await _keystrokeLogsCache.GetAsync<List<KeystrokeRecord>>(key).ConfigureAwait(false)
            ?? new List<KeystrokeRecord>();

        records.AddRange(request.KeystrokeData);

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
        var key = _keystrokeLogsCache.GetCacheKey(request.ExaminationId, request.StudentId, request.ProblemId);
        var allRecords = await _keystrokeLogsCache.GetAsync<List<KeystrokeRecord>>(key).ConfigureAwait(false)
            ?? new List<KeystrokeRecord>();

        allRecords.AddRange(request.KeystrokeData);

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
}
