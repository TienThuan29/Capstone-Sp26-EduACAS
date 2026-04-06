using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AcasService.Repositories.Caching.Redis.KeystrokeLogs;

public interface IKeystrokeLogsCache : IRedisCacheBaseRepository<Models.KeystrokeLog>
{
    string GetCacheKey(string examinationId, string studentId, string problemId);
}

public class KeystrokeLogsCache : RedisCacheBaseRepository<Models.KeystrokeLog>, IKeystrokeLogsCache
{
    public KeystrokeLogsCache(
        IDistributedCache cache,
        ILogger<KeystrokeLogsCache> logger)
        : base(cache, logger, absoluteExpireTime: TimeSpan.FromHours(24))
    {
    }

    public string GetCacheKey(string examinationId, string studentId, string problemId)
    {
        return    $"submission:student:{studentId}:exam:{examinationId}:problem:{problemId}";
    }
}
