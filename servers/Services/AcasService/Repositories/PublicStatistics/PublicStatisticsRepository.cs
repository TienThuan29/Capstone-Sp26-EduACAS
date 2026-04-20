using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.Caching.Redis;

namespace AcasService.Repositories.PublicStatistics;

public class PublicStatisticsRepository : IPublicStatisticsRepository
{
    private readonly IPublicStatisticsCache _publicStatisticsCache;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IProgrammingLanguageRepository _programmingLanguageRepository;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ILogger<PublicStatisticsRepository> _logger;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(15);

    public PublicStatisticsRepository(
        IPublicStatisticsCache publicStatisticsCache,
        IClassroomRepository classroomRepository,
        IProgrammingLanguageRepository programmingLanguageRepository,
        UserRequestProducer userRequestProducer,
        ILogger<PublicStatisticsRepository> logger
    )
    {
        _publicStatisticsCache = publicStatisticsCache;
        _classroomRepository = classroomRepository;
        _programmingLanguageRepository = programmingLanguageRepository;
        _userRequestProducer = userRequestProducer;
        _logger = logger;
    }

    public async Task<PublicStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var cacheKey = _publicStatisticsCache.GetStatisticsKey();

        var cached = await _publicStatisticsCache.GetAsync<PublicStatisticsResponse>(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Public statistics cache hit");
            return cached;
        }

        _logger.LogDebug("Public statistics cache miss — querying DynamoDB");

        var statistics = await ComputeStatisticsAsync(cancellationToken);

        await _publicStatisticsCache.SetAsync(cacheKey, statistics, CacheTtl);

        return statistics;
    }

    public async Task InvalidateCacheAsync(CancellationToken cancellationToken = default)
    {
        var cacheKey = _publicStatisticsCache.GetStatisticsKey();
        await _publicStatisticsCache.RemoveAsync(cacheKey);
        _logger.LogInformation("Public statistics cache invalidated");
    }

    private async Task<PublicStatisticsResponse> ComputeStatisticsAsync(CancellationToken cancellationToken)
    {
        try
        {
            var studentCountTask = CountStudentsAsync(cancellationToken);
            var lecturerCountTask = CountLecturersAsync(cancellationToken);
            var classroomCountTask = CountClassroomsAsync(cancellationToken);
            var programmingLanguageCountTask = CountProgrammingLanguagesAsync(cancellationToken);

            await Task.WhenAll(
                studentCountTask,
                lecturerCountTask,
                classroomCountTask,
                programmingLanguageCountTask
            );

            return new PublicStatisticsResponse
            {
                TotalStudents = studentCountTask.Result,
                TotalLecturers = lecturerCountTask.Result,
                TotalClassrooms = classroomCountTask.Result,
                TotalProgrammingLanguages = programmingLanguageCountTask.Result,
                LastUpdatedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing public statistics from DynamoDB");
            throw;
        }
    }

    private async Task<long> CountStudentsAsync(CancellationToken cancellationToken)
    {
        var allUsers = await _userRequestProducer.GetAllUsersAsync(cancellationToken);
        return allUsers.Count(u => u.Role.Equals("STUDENT", StringComparison.OrdinalIgnoreCase));
    }

    private async Task<long> CountLecturersAsync(CancellationToken cancellationToken)
    {
        var allUsers = await _userRequestProducer.GetAllUsersAsync(cancellationToken);
        return allUsers.Count(u => u.Role.Equals("LECTURER", StringComparison.OrdinalIgnoreCase));
    }

    private async Task<long> CountClassroomsAsync(CancellationToken cancellationToken)
    {
        var allClassrooms = await _classroomRepository.FindAllAsync();
        return allClassrooms.Count(c => !c.IsDeleted);
    }

    private async Task<long> CountProgrammingLanguagesAsync(CancellationToken cancellationToken)
    {
        var allLanguages = await _programmingLanguageRepository.GetAllAsync();
        return allLanguages.Count(l => l.Status == Models.PLStatus.ENABLE);
    }
}

