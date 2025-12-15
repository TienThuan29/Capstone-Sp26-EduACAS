using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using AuthService.Application.Queries;
using AuthService.Application.Mappers;
using AuthService.Repositories.User;

namespace AuthService.Messaging;

public class UserRequestConsumer : IHostedService
{
    private readonly RabbitMqHostedService _rabbitMqService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<UserRequestConsumer> _logger;
    private const string RequestQueueName = "user.get.request";
    private EventingBasicConsumer? _consumer;
    private string? _consumerTag;

    public UserRequestConsumer(
        RabbitMqHostedService rabbitMqService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<UserRequestConsumer> logger)
    {
        _rabbitMqService = rabbitMqService;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var channel = _rabbitMqService.Channel;

        // Declare request queue
        channel.QueueDeclare(
            queue: RequestQueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        // Set QoS to process one message at a time
        channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

        // Create consumer
        _consumer = new EventingBasicConsumer(channel);
        _consumer.Received += async (model, ea) =>
        {
            var responseBody = Array.Empty<byte>();
            var responseChannel = (model as IModel) ?? channel;
            
            // Create a scope for this message processing
            using var scope = _serviceScopeFactory.CreateScope();
            var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            var userMapper = scope.ServiceProvider.GetRequiredService<UserMapper>();
            
            try
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                var request = JsonSerializer.Deserialize<UserRequest>(message);

                if (request == null || string.IsNullOrEmpty(request.UserId))
                {
                    _logger.LogWarning("Invalid user request received");
                    responseBody = Encoding.UTF8.GetBytes("USER_NOT_FOUND");
                }
                else
                {
                    _logger.LogInformation("Processing user request: UserId={UserId}", request.UserId);

                    // Get user from repository
                    var user = await userRepository.FindByIdAsync(request.UserId);

                    if (user == null || !user.IsEnable)
                    {
                        _logger.LogWarning("User not found or inactive: UserId={UserId}", request.UserId);
                        responseBody = Encoding.UTF8.GetBytes("USER_NOT_FOUND");
                    }
                    else
                    {
                        // Map user to response
                        var userProfile = userMapper.ToUserResponse(user);
                        var responseJson = JsonSerializer.Serialize(userProfile);
                        responseBody = Encoding.UTF8.GetBytes(responseJson);

                        _logger.LogInformation("User found: UserId={UserId}, Email={Email}", 
                            user.Id, user.Email);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing user request");
                responseBody = Encoding.UTF8.GetBytes("USER_NOT_FOUND");
            }
            finally
            {
                // Send response
                var replyProperties = responseChannel.CreateBasicProperties();
                replyProperties.CorrelationId = ea.BasicProperties.CorrelationId;
                replyProperties.Persistent = true;

                responseChannel.BasicPublish(
                    exchange: "",
                    routingKey: ea.BasicProperties.ReplyTo,
                    basicProperties: replyProperties,
                    body: responseBody
                );

                // Acknowledge message
                responseChannel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            }
        };

        // Start consuming
        _consumerTag = channel.BasicConsume(
            queue: RequestQueueName,
            autoAck: false,
            consumer: _consumer
        );

        _logger.LogInformation("UserRequestConsumer started. Listening on queue: {QueueName}", RequestQueueName);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        if (_consumerTag != null && _rabbitMqService.Channel.IsOpen)
        {
            _rabbitMqService.Channel.BasicCancel(_consumerTag);
            _logger.LogInformation("UserRequestConsumer stopped");
        }

        return Task.CompletedTask;
    }
}

public class UserRequest
{
    public string UserId { get; set; } = string.Empty;
}

