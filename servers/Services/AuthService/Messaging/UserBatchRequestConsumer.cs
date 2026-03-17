using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using AuthService.Application.Mappers;
using AuthService.Repositories.User;

namespace AuthService.Messaging;

public class UserBatchRequestConsumer : IHostedService
{
    private readonly RabbitMqHostedService _rabbitMqService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<UserBatchRequestConsumer> _logger;
    private const string RequestQueueName = "user.getbatch.request";
    private EventingBasicConsumer? _consumer;
    private string? _consumerTag;

    public UserBatchRequestConsumer(
        RabbitMqHostedService rabbitMqService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<UserBatchRequestConsumer> logger)
    {
        _rabbitMqService = rabbitMqService;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var channel = _rabbitMqService.Channel;

        channel.QueueDeclare(
            queue: RequestQueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null
        );
        channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

        _consumer = new EventingBasicConsumer(channel);
        _consumer.Received += async (model, ea) =>
        {
            var responseChannel = (model as IModel) ?? channel;
            byte[] responseBody = Encoding.UTF8.GetBytes("[]");

            using var scope = _serviceScopeFactory.CreateScope();
            var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            var userMapper = scope.ServiceProvider.GetRequiredService<UserMapper>();

            try
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                var request = JsonSerializer.Deserialize<UserBatchRequest>(message);

                if (request?.UserIds == null || request.UserIds.Count == 0)
                {
                    responseBody = Encoding.UTF8.GetBytes("[]");
                }
                else
                {
                    var users = await userRepository.FindByIdsAsync(request.UserIds);
                    var profiles = users
                        .Where(u => u.IsEnable)
                        .Select(userMapper.ToUserResponse)
                        .ToList();
                    var responseJson = JsonSerializer.Serialize(profiles);
                    responseBody = Encoding.UTF8.GetBytes(responseJson);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing user batch request");
                responseBody = Encoding.UTF8.GetBytes("[]");
            }
            finally
            {
                var replyProperties = responseChannel.CreateBasicProperties();
                replyProperties.CorrelationId = ea.BasicProperties.CorrelationId;
                replyProperties.Persistent = true;

                responseChannel.BasicPublish(
                    exchange: "",
                    routingKey: ea.BasicProperties.ReplyTo,
                    basicProperties: replyProperties,
                    body: responseBody
                );
                responseChannel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            }
        };

        _consumerTag = channel.BasicConsume(
            queue: RequestQueueName,
            autoAck: false,
            consumer: _consumer
        );

        _logger.LogInformation("UserBatchRequestConsumer started. Listening on queue: {QueueName}", RequestQueueName);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        if (_consumerTag != null && _rabbitMqService.Channel.IsOpen)
        {
            _rabbitMqService.Channel.BasicCancel(_consumerTag);
            _logger.LogInformation("UserBatchRequestConsumer stopped");
        }
        return Task.CompletedTask;
    }
}

public class UserBatchRequest
{
    public List<string> UserIds { get; set; } = new();
}
