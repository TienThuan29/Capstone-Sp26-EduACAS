using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace AcasService.Messaging;

public class UserRequestProducer
{
    private readonly RabbitMqHostedService _rabbitMqService;
    private readonly ILogger<UserRequestProducer> _logger;
    private const string RequestQueueName = "user.get.request";
    private const string ResponseQueueName = "user.get.response";

    public UserRequestProducer(
        RabbitMqHostedService rabbitMqService,
        ILogger<UserRequestProducer> logger)
    {
        _rabbitMqService = rabbitMqService;
        _logger = logger;
        InitializeQueues();
    }

    private void InitializeQueues()
    {
        var channel = _rabbitMqService.Channel;
        
        // Declare request queue
        channel.QueueDeclare(
            queue: RequestQueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null
        );

        // Declare response queue
        channel.QueueDeclare(
            queue: ResponseQueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null
        );

        _logger.LogInformation("RabbitMQ queues initialized: {RequestQueue}, {ResponseQueue}", 
            RequestQueueName, ResponseQueueName);
    }

    public async Task<UserProfileResponse?> GetUserByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var channel = _rabbitMqService.Channel;
        var correlationId = Guid.NewGuid().ToString();
        var responseQueueName = $"{ResponseQueueName}.{correlationId}";

        try
        {
            // Declare temporary response queue for this request
            channel.QueueDeclare(
                queue: responseQueueName,
                durable: false,
                exclusive: true,
                autoDelete: true,
                arguments: null
            );

            // Create consumer for response
            var responseReceived = new TaskCompletionSource<UserProfileResponse?>();
            var consumer = new EventingBasicConsumer(channel);
            
            consumer.Received += (model, ea) =>
            {
                try
                {
                    if (ea.BasicProperties.CorrelationId == correlationId)
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);
                        
                        if (message == "USER_NOT_FOUND")
                        {
                            responseReceived.SetResult(null);
                        }
                        else
                        {
                            var userProfile = JsonSerializer.Deserialize<UserProfileResponse>(message);
                            responseReceived.SetResult(userProfile);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing user response");
                    responseReceived.SetResult(null);
                }
            };

            var consumerTag = channel.BasicConsume(
                queue: responseQueueName,
                autoAck: true,
                consumer: consumer);

            // Send request
            var requestMessage = JsonSerializer.Serialize(new { UserId = userId });
            var requestBody = Encoding.UTF8.GetBytes(requestMessage);

            var properties = channel.CreateBasicProperties();
            properties.CorrelationId = correlationId;
            properties.ReplyTo = responseQueueName;
            properties.Persistent = true;

            channel.BasicPublish(
                exchange: "",
                routingKey: RequestQueueName,
                basicProperties: properties,
                body: requestBody);

            _logger.LogInformation("User request sent: UserId={UserId}, CorrelationId={CorrelationId}", 
                userId, correlationId);

            // Wait for response with timeout
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            try
            {
                var response = await responseReceived.Task.WaitAsync(linkedCts.Token);
                
                // Cancel consumer
                channel.BasicCancel(consumerTag);
                
                return response;
            }
            catch (OperationCanceledException)
            {
                channel.BasicCancel(consumerTag);
                _logger.LogWarning("User request timed out: UserId={UserId}, CorrelationId={CorrelationId}", 
                    userId, correlationId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending user request: UserId={UserId}", userId);
            return null;
        }
    }
}

public class UserProfileResponse
{
    public string Id { get; set; } = string.Empty;
    public string RoleNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public DateTime? Birthday { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsEnable { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

