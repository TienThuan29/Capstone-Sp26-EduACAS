using Microsoft.Extensions.Diagnostics.HealthChecks;
using RabbitMQ.Client;

namespace AuthService.Messaging;

public class RabbitMqHealthCheck : IHealthCheck
{
    private readonly RabbitMqHostedService _rabbitMqService;

    public RabbitMqHealthCheck(RabbitMqHostedService rabbitMqService)
    {
        _rabbitMqService = rabbitMqService;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (_rabbitMqService.Connection?.IsOpen == true && 
                _rabbitMqService.Channel?.IsOpen == true)
            {
                return Task.FromResult(HealthCheckResult.Healthy("RabbitMQ connection is open"));
            }

            return Task.FromResult(HealthCheckResult.Unhealthy("RabbitMQ connection is not open"));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("RabbitMQ health check failed", ex));
        }
    }
}

