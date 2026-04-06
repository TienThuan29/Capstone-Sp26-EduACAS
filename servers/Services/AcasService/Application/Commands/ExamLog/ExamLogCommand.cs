using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Caching.Redis.ExamLog;
using AcasService.Repositories.ExamLog;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.ExamLog;

public interface IExamLogCommand
{
    Task<ExamLogResponse?> CreateAsync(CreateExamLogRequest request);
    Task<int> CacheAsync(CacheExamLogsRequest request);
    Task<int> FlushCachedAsync(FlushCachedExamLogsRequest request);
}

public class ExamLogCommand : IExamLogCommand
{
    private readonly IExamLogRepository _examLogRepository;
    private readonly IExamLogCache _examLogCache;
    private readonly ExamLogMapper _examLogMapper;
    private readonly ILogger<ExamLogCommand> _logger;

    public ExamLogCommand(
        IExamLogRepository examLogRepository,
        IExamLogCache examLogCache,
        ExamLogMapper examLogMapper,
        ILogger<ExamLogCommand> logger)
    {
        _examLogRepository = examLogRepository;
        _examLogCache = examLogCache;
        _examLogMapper = examLogMapper;
        _logger = logger;
    }

    public async Task<ExamLogResponse?> CreateAsync(CreateExamLogRequest request)
    {
        try
        {
            var entity = _examLogMapper.ToEntity(request);
            var created = await _examLogRepository.CreateAsync(entity);
            if (created == null)
                return null;

            return _examLogMapper.ToResponse(created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating exam log for submission {SubmissionId}", request.SubmissionId);
            throw;
        }
    }

    public async Task<int> CacheAsync(CacheExamLogsRequest request)
    {
        var key = _examLogCache.GetSessionLogKey(request.SessionKey);
        var existing = await _examLogCache.GetAsync<List<CacheExamLogEntryRequest>>(key) ?? new List<CacheExamLogEntryRequest>();
        existing.AddRange(request.Entries);
        await _examLogCache.SetAsync(key, existing);
        return request.Entries.Count;
    }

    public async Task<int> FlushCachedAsync(FlushCachedExamLogsRequest request)
    {
        var key = _examLogCache.GetSessionLogKey(request.SessionKey);
        var cachedEntries = await _examLogCache.GetAsync<List<CacheExamLogEntryRequest>>(key) ?? new List<CacheExamLogEntryRequest>();
        if (cachedEntries.Count == 0) return 0;

        var flushed = 0;
        foreach (var entry in cachedEntries)
        {
            var created = await _examLogRepository.CreateAsync(_examLogMapper.ToEntity(new CreateExamLogRequest
            {
                SubmissionId = request.SubmissionId,
                EventType = entry.EventType,
                EventDetail = entry.EventDetail,
                Message = entry.Message,
                Severity = entry.Severity,
                IsViolation = entry.IsViolation,
                ClientTimestamp = entry.ClientTimestamp,
            }));

            if (created != null) flushed += 1;
        }

        await _examLogCache.RemoveAsync(key);
        return flushed;
    }
}
