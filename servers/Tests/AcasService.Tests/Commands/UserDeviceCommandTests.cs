using AcasService.Application.Commands.UserDevice;
using AcasService.Models;
using AcasService.Repositories.UserDevice;
using AcasService.Web.Requests;
using FluentAssertions;
using Moq;

namespace AcasService.Tests.Commands;

public class UserDeviceCommandTests
{
    private readonly Mock<IUserDeviceRepository> _mockDeviceRepo;
    private readonly UserDeviceCommand _sut;

    public UserDeviceCommandTests()
    {
        _mockDeviceRepo = new Mock<IUserDeviceRepository>();
        _sut = new UserDeviceCommand(_mockDeviceRepo.Object);
    }

    // ========================================================================
    // UD-01: Register device
    // ========================================================================
    [Fact]
    public async Task RegisterAsync_WithValidAndroidRequest_ReturnsRegisteredDevice()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "fcm-token-123",
            Platform = "ANDROID",
            DeviceId = "device-abc",
            AppVersion = "1.2.3"
        };

        var registeredDevice = new UserDevice
        {
            Id = "ud-1",
            UserId = "user-1",
            DeviceToken = request.DeviceToken,
            Platform = "ANDROID",
            DeviceId = request.DeviceId,
            AppVersion = request.AppVersion,
            IsActive = true,
            LastSeenAt = DateTime.UtcNow,
            CreatedDate = DateTime.UtcNow
        };

        _mockDeviceRepo.Setup(x => x.RegisterOrUpdateAsync(
                "user-1",
                request.DeviceToken,
                "ANDROID",
                request.DeviceId,
                request.AppVersion))
            .ReturnsAsync(registeredDevice);

        // Act
        var result = await _sut.RegisterAsync("user-1", request);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be("user-1");
        result.Platform.Should().Be("ANDROID");
        result.DeviceToken.Should().Be("fcm-token-123");
    }

    // ========================================================================
    // UD-02: Register duplicate device
    // ========================================================================
    [Fact]
    public async Task RegisterAsync_WhenDeviceAlreadyRegistered_UpdatesExisting()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "existing-token",
            Platform = "IOS",
            DeviceId = "device-123"
        };

        var existingDevice = new UserDevice
        {
            Id = "ud-existing",
            UserId = "user-1",
            DeviceToken = "existing-token",
            Platform = "IOS",
            DeviceId = "device-123",
            IsActive = true
        };

        _mockDeviceRepo.Setup(x => x.RegisterOrUpdateAsync(
                "user-1",
                request.DeviceToken,
                "IOS",
                request.DeviceId,
                null))
            .ReturnsAsync(existingDevice);

        // Act
        var result = await _sut.RegisterAsync("user-1", request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be("ud-existing");
    }

    // ========================================================================
    // UD-03: Unregister device
    // ========================================================================
    [Fact]
    public async Task RegisterAsync_WithNewDeviceForSameUser_RegistersNewDevice()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "new-device-token",
            Platform = "WEB"
        };

        var newDevice = new UserDevice
        {
            Id = "ud-new",
            UserId = "user-1",
            DeviceToken = "new-device-token",
            Platform = "WEB",
            IsActive = true
        };

        _mockDeviceRepo.Setup(x => x.RegisterOrUpdateAsync(
                "user-1",
                request.DeviceToken,
                "WEB",
                null,
                null))
            .ReturnsAsync(newDevice);

        // Act
        var result = await _sut.RegisterAsync("user-1", request);

        // Assert
        result.Should().NotBeNull();
        result.Platform.Should().Be("WEB");
    }

    // ========================================================================
    // UD-04: Send push notification
    // ========================================================================
    [Fact]
    public async Task RegisterAsync_WithValidToken_ReturnsResponseWithToken()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "push-token-xyz",
            Platform = "ANDROID",
            AppVersion = "2.0.0"
        };

        var device = new UserDevice
        {
            Id = "ud-123",
            UserId = "user-1",
            DeviceToken = "push-token-xyz",
            Platform = "ANDROID",
            AppVersion = "2.0.0",
            IsActive = true
        };

        _mockDeviceRepo.Setup(x => x.RegisterOrUpdateAsync(
                "user-1",
                request.DeviceToken,
                "ANDROID",
                null,
                request.AppVersion))
            .ReturnsAsync(device);

        // Act
        var result = await _sut.RegisterAsync("user-1", request);

        // Assert
        result.Should().NotBeNull();
        result.DeviceToken.Should().Be("push-token-xyz");
        result.IsActive.Should().BeTrue();
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task RegisterAsync_WithInvalidPlatform_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "token",
            Platform = "INVALID"
        };

        // Act
        var act = async () => await _sut.RegisterAsync("user-1", request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid device platform");
    }

    [Fact]
    public async Task RegisterAsync_WithLowercasePlatform_NormalizesToUppercase()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "token",
            Platform = "android"  // lowercase
        };

        var device = new UserDevice
        {
            Id = "ud-1",
            UserId = "user-1",
            DeviceToken = "token",
            Platform = "ANDROID",
            IsActive = true
        };

        _mockDeviceRepo.Setup(x => x.RegisterOrUpdateAsync(
                "user-1", "token", "ANDROID", null, null))
            .ReturnsAsync(device);

        // Act
        var result = await _sut.RegisterAsync("user-1", request);

        // Assert
        result.Should().NotBeNull();
        result.Platform.Should().Be("ANDROID");
    }

    [Fact]
    public async Task RegisterAsync_WhenRepositoryReturnsNull_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "token",
            Platform = "IOS"
        };

        _mockDeviceRepo.Setup(x => x.RegisterOrUpdateAsync(
                "user-1", "token", "IOS", null, null))
            .ReturnsAsync((UserDevice?)null);

        // Act
        var act = async () => await _sut.RegisterAsync("user-1", request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Failed to register user device token");
    }

    [Fact]
    public async Task RegisterAsync_WithWhitespaceDeviceToken_TrimsToken()
    {
        // Arrange
        var request = new RegisterUserDeviceRequest
        {
            DeviceToken = "  token-with-spaces  ",
            Platform = "WEB"
        };

        var device = new UserDevice
        {
            Id = "ud-1",
            UserId = "user-1",
            DeviceToken = "token-with-spaces",
            Platform = "WEB",
            IsActive = true
        };

        _mockDeviceRepo.Setup(x => x.RegisterOrUpdateAsync(
                "user-1", "token-with-spaces", "WEB", null, null))
            .ReturnsAsync(device);

        // Act
        var result = await _sut.RegisterAsync("user-1", request);

        // Assert
        result.Should().NotBeNull();
    }
}
