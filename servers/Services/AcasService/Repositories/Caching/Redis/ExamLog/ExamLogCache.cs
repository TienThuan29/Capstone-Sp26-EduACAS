using AcasService.Repositories.Caching.Redis;
using Microsoft.Extensions.Caching.Distributed;

namespace AcasService.Repositories.Caching.Redis.ExamLog;

public interface IExamLogCache : IRedisCacheBaseRepository<Web.Requests.CacheExamLogEntryRequest>
{
    string GetSessionLogKey(string sessionKey);
}

public class ExamLogCache : RedisCacheBaseRepository<Web.Requests.CacheExamLogEntryRequest>, IExamLogCache
{
    public ExamLogCache(IDistributedCache cache, ILogger<ExamLogCache> logger) : base(cache, logger)
    {
    }

    public string GetSessionLogKey(string sessionKey) => $"exam-log:session:{sessionKey}";
}
