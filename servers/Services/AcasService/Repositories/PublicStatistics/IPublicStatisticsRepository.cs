using AcasService.Application.ResponseDTOs;

namespace AcasService.Repositories.PublicStatistics;

public interface IPublicStatisticsRepository
{
    Task<PublicStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default);

    Task InvalidateCacheAsync(CancellationToken cancellationToken = default);
}
