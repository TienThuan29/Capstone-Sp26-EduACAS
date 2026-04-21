using AcasService.Application.Commands.Notification;
using AcasService.Models;
using AcasService.Repositories.Notification;
using AcasService.Repositories.UserDevice;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class NotificationCommandTests
{
    private readonly Mock<INotificationRepository> _mockNotificationRepo;
    private readonly Mock<IUserDeviceRepository> _mockDeviceRepo;
    private readonly Mock<IFirebaseCloudMessageService> _mockFirebase;
    private readonly Mock<ILogger<NotificationCommand>> _mockLogger;
    private readonly NotificationCommand _sut;

    public NotificationCommandTests()
    {
        _mockNotificationRepo = new Mock<INotificationRepository>();
        _mockDeviceRepo = new Mock<IUserDeviceRepository>();
        _mockFirebase = new Mock<IFirebaseCloudMessageService>();
        _mockLogger = new Mock<ILogger<NotificationCommand>>();

        _sut = new NotificationCommand(
            _mockNotificationRepo.Object,
            _mockDeviceRepo.Object,
            _mockFirebase.Object,
            _mockLogger.Object);
    }

    // ========================================================================
    // NTF-01: Send notification to single user
    // ========================================================================
    [Fact]
    public async Task CreateAndSendAsync_WithValidRequest_CreatesAndDispatches()
    {
        // Arrange
        var request = new CreateNotificationRequest
        {
            TargetUserId = "user-1",
            Title = "New Exam",
            Body = "An exam has been posted",
            Type = "NEW_EXAMINATION",
            Payload = new Dictionary<string, object?> { ["examId"] = "exam-1" }
        };

        var createdNotification = new Notification
        {
            Id = "notif-1",
            TargetUserId = request.TargetUserId,
            Title = request.Title,
            Body = request.Body,
            Type = NotificationType.NEW_EXAMINATION,
            SentDate = DateTime.UtcNow
        };

        var devices = new List<UserDevice>
        {
            new() { DeviceToken = "token-1" },
            new() { DeviceToken = "token-2" }
        };

        _mockNotificationRepo.Setup(x => x.CreateAsync(It.IsAny<Notification>()))
            .ReturnsAsync(createdNotification);
        _mockDeviceRepo.Setup(x => x.FindActiveByUserIdAsync("user-1"))
            .ReturnsAsync(devices);
        _mockFirebase.Setup(x => x.SendAsync(It.IsAny<Notification>(), It.IsAny<IReadOnlyCollection<string>>()))
            .ReturnsAsync(new FcmDispatchResult { TotalTokens = 2, SuccessCount = 2, FailureCount = 0 });

        // Act
        var result = await _sut.CreateAndSendAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.NotificationId.Should().Be("notif-1");
        result.TotalTokens.Should().Be(2);
        result.SuccessCount.Should().Be(2);
        _mockFirebase.Verify(x => x.SendAsync(
            It.IsAny<Notification>(),
            It.Is<IReadOnlyCollection<string>>(t => t.Count == 2)), Times.Once);
    }

    // ========================================================================
    // NTF-02: Send notification to multiple users
    // ========================================================================
    [Fact]
    public async Task CreateAndSendAsync_WhenNoDevicesFound_DispatchesWithZeroTokens()
    {
        // Arrange
        var request = new CreateNotificationRequest
        {
            TargetUserId = "user-1",
            Title = "Test",
            Body = "Test body",
            Type = "SYSTEM"
        };

        var createdNotification = new Notification
        {
            Id = "notif-1",
            TargetUserId = "user-1",
            Title = "Test",
            Body = "Test body",
            Type = NotificationType.SYSTEM,
            SentDate = DateTime.UtcNow
        };

        _mockNotificationRepo.Setup(x => x.CreateAsync(It.IsAny<Notification>()))
            .ReturnsAsync(createdNotification);
        _mockDeviceRepo.Setup(x => x.FindActiveByUserIdAsync("user-1"))
            .ReturnsAsync(new List<UserDevice>());
        _mockFirebase.Setup(x => x.SendAsync(It.IsAny<Notification>(), It.IsAny<IReadOnlyCollection<string>>()))
            .ReturnsAsync(new FcmDispatchResult { TotalTokens = 0, SuccessCount = 0, FailureCount = 0 });

        // Act
        var result = await _sut.CreateAndSendAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.TotalTokens.Should().Be(0);
        result.SuccessCount.Should().Be(0);
    }

    // ========================================================================
    // NTF-03: Mark notification as read
    // ========================================================================
    [Fact]
    public async Task MarkAsReadAsync_WhenNotificationExists_ReturnsTrue()
    {
        // Arrange
        var notification = new Notification
        {
            Id = "notif-1",
            TargetUserId = "user-1",
            Title = "Test",
            Body = "Body",
            Type = NotificationType.SYSTEM,
            IsRead = false
        };

        _mockNotificationRepo.Setup(x => x.FindByIdAsync("notif-1"))
            .ReturnsAsync(notification);
        _mockNotificationRepo.Setup(x => x.UpdateAsync(It.IsAny<Notification>()))
            .ReturnsAsync((Notification n) => n);

        // Act
        var result = await _sut.MarkAsReadAsync("notif-1");

        // Assert
        result.Should().BeTrue();
        _mockNotificationRepo.Verify(x => x.UpdateAsync(
            It.Is<Notification>(n => n.IsRead == true)), Times.Once);
    }

    // ========================================================================
    // NTF-04: Mark non-existent notification
    // ========================================================================
    [Fact]
    public async Task MarkAsReadAsync_WhenNotificationNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockNotificationRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((Notification?)null);

        // Act
        var act = async () => await _sut.MarkAsReadAsync("nonexistent");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Notification not found");
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task MarkAsReadAsync_WithEmptyNotificationId_ThrowsArgumentException()
    {
        // Act
        var act = async () => await _sut.MarkAsReadAsync("");

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("notificationId is required*");
    }

    [Fact]
    public async Task SoftDeleteAsync_WhenNotificationExists_ReturnsTrue()
    {
        // Arrange
        var notification = new Notification
        {
            Id = "notif-1",
            TargetUserId = "user-1",
            Title = "Test",
            Body = "Body",
            Type = NotificationType.SYSTEM,
            IsDeleted = false
        };

        _mockNotificationRepo.Setup(x => x.FindByIdAsync("notif-1"))
            .ReturnsAsync(notification);
        _mockNotificationRepo.Setup(x => x.UpdateAsync(It.IsAny<Notification>()))
            .ReturnsAsync((Notification n) => n);

        // Act
        var result = await _sut.SoftDeleteAsync("notif-1");

        // Assert
        result.Should().BeTrue();
        _mockNotificationRepo.Verify(x => x.UpdateAsync(
            It.Is<Notification>(n => n.IsDeleted == true)), Times.Once);
    }

    [Fact]
    public async Task CreateAndSendAsync_WithInvalidType_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new CreateNotificationRequest
        {
            TargetUserId = "user-1",
            Title = "Test",
            Body = "Body",
            Type = "INVALID_TYPE"
        };

        // Act
        var act = async () => await _sut.CreateAndSendAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid notification type");
    }
}
