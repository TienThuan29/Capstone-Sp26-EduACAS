using AcasService.Messaging;
using AcasService.Messaging.User;
using Microsoft.Extensions.Logging;
using Moq;
using RabbitMQ.Client;

namespace AcasService.Tests.Commands;

/// <summary>
/// Test-only subclass of UserRequestProducer that skips RabbitMQ queue initialization.
/// This allows the producer to be used without a real RabbitMQ connection.
/// </summary>
internal class TestableUserRequestProducer : UserRequestProducer
{
    public TestableUserRequestProducer(ILogger<UserRequestProducer> logger)
        : base(CreateFakeRabbitMqService(), logger)
    {
    }

    /// <summary>
    /// Overrides InitializeQueues to do nothing in tests.
    /// </summary>
    protected override void InitializeQueues()
    {
        // Skip queue initialization in tests
    }

    private static RabbitMqHostedService CreateFakeRabbitMqService()
    {
        var mockChannel = new Mock<IModel>();
        var mockConnection = new Mock<IConnection>();
        mockConnection.Setup(c => c.CreateModel()).Returns(mockChannel.Object);
        mockConnection.Setup(c => c.IsOpen).Returns(true);
        mockChannel.Setup(c => c.IsOpen).Returns(true);

        return new TestableRabbitMqHostedService(
            mockConnection.Object,
            mockChannel.Object,
            Mock.Of<ILogger<RabbitMqHostedService>>());
    }
}

/// <summary>
/// Test-only subclass of RabbitMqHostedService that uses injected mock connections.
/// </summary>
internal class TestableRabbitMqHostedService : RabbitMqHostedService
{
    public TestableRabbitMqHostedService(
        IConnection connection,
        IModel channel,
        ILogger<RabbitMqHostedService> logger)
        : base(connection, channel, logger)
    {
    }
}
