using AcasService.Repositories.Caching.Redis;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AcasService.Repositories.Caching.Redis.Quiz;

public interface IQuizCache : IRedisCacheBaseRepository<Dictionary<string, string>>
{
    string GetQuizAttemptKey(string attemptId);
}

public class QuizCache : RedisCacheBaseRepository<Dictionary<string, string>>, IQuizCache
{
    public QuizCache(IDistributedCache cache, ILogger<QuizCache> logger) : base(cache, logger)
    {
    }

    public string GetQuizAttemptKey(string attemptId) => $"quiz_attempt:{attemptId}";
}
