using RabbitMQ.Client;
using Microsoft.Extensions.Options;

namespace AcasService.Messaging;

public class RabbitMqHostedService : IHostedService
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly ILogger<RabbitMqHostedService> _logger;
    private readonly string _hostName;
    private readonly int _port;
    private readonly string _userName;
    private readonly string _password;
    private readonly string _virtualHost;

    public RabbitMqHostedService(
        IConfiguration configuration,
        ILogger<RabbitMqHostedService> logger)
    {
        _logger = logger;
        _hostName = configuration["RabbitMQ:HostName"] ?? 
                   throw new ArgumentNullException("RabbitMQ:HostName is not configured");
        _port = configuration.GetValue<int>("RabbitMQ:Port", 5672);
        _userName = configuration["RabbitMQ:UserName"] ?? 
                   throw new ArgumentNullException("RabbitMQ:UserName is not configured");
        _password = configuration["RabbitMQ:Password"] ?? 
                   throw new ArgumentNullException("RabbitMQ:Password is not configured");
        _virtualHost = configuration["RabbitMQ:VirtualHost"] ?? "/";

        var factory = new ConnectionFactory
        {
            HostName = _hostName,
            Port = _port,
            UserName = _userName,
            Password = _password,
            VirtualHost = _virtualHost,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
    }

    public IConnection Connection => _connection;
    public IModel Channel => _channel;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        try
        {
            _logger.LogInformation("Checking RabbitMQ connection...");
            
            if (!_connection.IsOpen)
            {
                _logger.LogWarning("RabbitMQ connection is not open. Attempting to reconnect...");
            }

            // Test connection by declaring a test queue (will be deleted immediately)
            var testQueueName = $"health-check-{Guid.NewGuid()}";
            _channel.QueueDeclare(
                queue: testQueueName,
                durable: false,
                exclusive: true,
                autoDelete: true,
                arguments: null);
            
            _channel.QueueDelete(testQueueName);
            
            _logger.LogInformation("RabbitMQ connection established successfully");
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("RabbitMQ connection check timed out; proceeding without blocking startup");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "RabbitMQ connection check failed; service will attempt on first real call");
        }
        
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Closing RabbitMQ connection...");
            
            if (_channel.IsOpen)
            {
                _channel.Close();
            }
            
            if (_connection.IsOpen)
            {
                _connection.Close();
            }
            
            _channel.Dispose();
            _connection.Dispose();
            
            _logger.LogInformation("RabbitMQ connection closed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing RabbitMQ connection");
        }
        
        return Task.CompletedTask;
    }
}

