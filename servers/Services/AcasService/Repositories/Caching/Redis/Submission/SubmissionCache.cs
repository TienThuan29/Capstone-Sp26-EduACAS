using AcasService.Repositories.Caching.Redis;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AcasService.Repositories.Caching.Redis.Submission;

public interface ISubmissionCache : IRedisCacheBaseRepository<Models.Submission>
{
      string GetSubmissionsListKey(string studentId, string examId, string problemId);
}

public class SubmissionCache : RedisCacheBaseRepository<Models.Submission>, ISubmissionCache
{
      public SubmissionCache(IDistributedCache cache, ILogger<SubmissionCache> logger) : base(cache, logger)
      {
      }

      public string GetSubmissionsListKey(string studentId, string examId, string problemId) =>
            $"submission:student:{studentId}:exam:{examId}:problem:{problemId}";
}