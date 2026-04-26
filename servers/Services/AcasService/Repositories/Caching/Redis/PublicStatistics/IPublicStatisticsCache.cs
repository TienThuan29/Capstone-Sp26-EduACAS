using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Caching.Redis;

namespace AcasService.Repositories.Caching.Redis;

public interface IPublicStatisticsCache : IRedisCacheBaseRepository<PublicStatisticsResponse>
{
    string GetStatisticsKey();
}
