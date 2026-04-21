using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AcasService.Repositories.Caching.Redis;

public class PublicStatisticsCache : RedisCacheBaseRepository<Application.ResponseDTOs.PublicStatisticsResponse>, IPublicStatisticsCache
{
    public const string CacheKey = "public_statistics";

    public PublicStatisticsCache(
        IDistributedCache cache,
        ILogger<PublicStatisticsCache> logger
    ) : base(cache, logger)
    {
    }

    public string GetStatisticsKey() => CacheKey;
}
