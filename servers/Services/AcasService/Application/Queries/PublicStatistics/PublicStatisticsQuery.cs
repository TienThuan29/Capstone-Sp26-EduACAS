using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.PublicStatistics;

namespace AcasService.Application.Queries.PublicStatistics;

public interface IPublicStatisticsQuery
{
    Task<PublicStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default);
}

public class PublicStatisticsQuery : IPublicStatisticsQuery
{
    private readonly IPublicStatisticsRepository _publicStatisticsRepository;
    private readonly ILogger<PublicStatisticsQuery> _logger;

    public PublicStatisticsQuery(
        IPublicStatisticsRepository publicStatisticsRepository,
        ILogger<PublicStatisticsQuery> logger
    )
    {
        _publicStatisticsRepository = publicStatisticsRepository;
        _logger = logger;
    }

    public async Task<PublicStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var statistics = await _publicStatisticsRepository.GetStatisticsAsync(cancellationToken);
            _logger.LogInformation(
                "Public statistics retrieved: Students={Students}, Lecturers={Lecturers}, Classrooms={Classrooms}, Languages={Languages}",
                statistics.TotalStudents,
                statistics.TotalLecturers,
                statistics.TotalClassrooms,
                statistics.TotalProgrammingLanguages
            );
            return statistics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching public statistics.");
            throw;
        }
    }
}
