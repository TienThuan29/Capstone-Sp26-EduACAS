using StackExchange.Redis;
using Microsoft.Extensions.Options;

namespace AcasService.Repositories.Redis;

public class RedisHostedService : IHostedService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisHostedService> _logger;

    public RedisHostedService(
        IConnectionMultiplexer redis,
        ILogger<RedisHostedService> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public IConnectionMultiplexer Connection => _redis;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        try
        {
            _logger.LogInformation("Checking Redis connection...");
            
            if (!_redis.IsConnected)
            {
                _logger.LogWarning("Redis connection is not established. Attempting to reconnect...");
                await _redis.GetDatabase().StringGetAsync("health-check");
            }

            var db = _redis.GetDatabase();
            var pong = await db.StringSetAsync("health-check", "ping", TimeSpan.FromSeconds(5));
            
            if (pong)
            {
                _logger.LogInformation("Redis connection established successfully");
            }
            else
            {
                _logger.LogWarning("Redis health check failed");
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Redis connection check timed out; proceeding without blocking startup");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis connection check failed; service will attempt on first real call");
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Closing Redis connection...");
            await _redis.CloseAsync();
            _logger.LogInformation("Redis connection closed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing Redis connection");
        }
    }
}

