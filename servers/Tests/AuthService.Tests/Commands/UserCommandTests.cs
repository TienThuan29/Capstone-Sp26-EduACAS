using AuthService.Application.Commands;
using AuthService.Application.Mappers;
using AuthService.Application.Notifications;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Models;
using AuthService.Repositories.User;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AuthService.Tests.Commands;

public class UserCommandTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IUserOptCacheRepository> _userOptCacheRepositoryMock;
    private readonly Mock<IUserCacheRepository> _userCacheRepositoryMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<ILogger<UserCommand>> _loggerMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly JwtUtil _jwtUtil;
    private readonly UserMapper _userMapper;
    private readonly UserCommand _sut;

    public UserCommandTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _userOptCacheRepositoryMock = new Mock<IUserOptCacheRepository>();
        _userCacheRepositoryMock = new Mock<IUserCacheRepository>();
        _configurationMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<UserCommand>>();
        _emailServiceMock = new Mock<IEmailService>();

        // Setup JWT config for JwtUtil
        var jwtSection = new Dictionary<string, string?>
        {
            { "Jwt:JwtSecret", "valid-32-char-secret-key-here12345678" },
            { "Jwt:JwtAccessTokenExpiration", "1d" },
            { "Jwt:JwtRefreshTokenExpiration", "7d" },
            { "Jwt:Issuer", "AuthService" },
            { "Jwt:Audience", "Acas" }
        };
        _configurationMock.Setup(c => c["Jwt:JwtSecret"]).Returns("valid-32-char-secret-key-here12345678");
        _configurationMock.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns("1d");
        _configurationMock.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns("7d");
        _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("AuthService");
        _configurationMock.Setup(c => c["Jwt:Audience"]).Returns("Acas");

        // Setup Hashing config for UserMapper
        _configurationMock.Setup(c => c["HashingSecretKey"]).Returns("test-hashing-secret-key-1234567890");

        _jwtUtil = new JwtUtil(_configurationMock.Object);
        _userMapper = new UserMapper();

        _sut = new UserCommand(
            _userRepositoryMock.Object,
            _configurationMock.Object,
            _userMapper,
            _jwtUtil,
            _loggerMock.Object,
            _userOptCacheRepositoryMock.Object,
            _userCacheRepositoryMock.Object,
            _emailServiceMock.Object
        );
    }

    #region UpdateUserAsync Tests

    /// <summary>
    /// F020-UTCID01
    /// Condition tested: repository returns non-null user (line 395-400 in code)
    /// </summary>
    [Fact]
    public async Task UpdateUserAsync_AllFieldsProvided_UpdateSucceeds_ReturnsUserProfileResponse()
    {
        // Arrange
        var userId = "u1";
        var fullname = "New Name";
        var roleNumber = "SE999999";
        var role = Role.LECTURER;
        var isEnable = true;

        var updatedUser = new User
        {
            Id = userId,
            Fullname = fullname,
            RoleNumber = roleNumber,
            Role = role,
            IsEnable = isEnable,
            Email = "test@example.com"
        };

        _userRepositoryMock
            .Setup(r => r.UpdateUserAsync(userId, fullname, roleNumber, role, isEnable))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _sut.UpdateUserAsync(userId, fullname, roleNumber, role, isEnable);

        // Assert
        result.Should().NotBeNull();
        result.Fullname.Should().Be(fullname);
        result.RoleNumber.Should().Be(roleNumber);
        result.Role.Should().Be(role.ToString());
        result.IsEnable.Should().Be(isEnable);

        _userRepositoryMock.Verify(
            r => r.UpdateUserAsync(userId, fullname, roleNumber, role, isEnable),
            Times.Once
        );
    }

    /// <summary>
    /// F020-UTCID02
    /// Condition tested: repository returns non-null user (line 395-400 in code)
    /// </summary>
    [Fact]
    public async Task UpdateUserAsync_AllParametersNull_UpdateSucceeds_ReturnsUserProfileResponse()
    {
        // Arrange
        var userId = "u1";

        var existingUser = new User
        {
            Id = userId,
            Fullname = "Existing Name",
            RoleNumber = "SE111111",
            Role = Role.ADMIN,
            IsEnable = true,
            Email = "existing@example.com"
        };

        _userRepositoryMock
            .Setup(r => r.UpdateUserAsync(userId, null, null, null, null))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _sut.UpdateUserAsync(userId, null, null, null, null);

        // Assert
        result.Should().NotBeNull();
        result.Fullname.Should().Be("Existing Name");
        result.RoleNumber.Should().Be("SE111111");
        result.Role.Should().Be(Role.ADMIN.ToString());
        result.IsEnable.Should().BeTrue();

        _userRepositoryMock.Verify(
            r => r.UpdateUserAsync(userId, null, null, null, null),
            Times.Once
        );
    }

    /// <summary>
    /// F020-UTCID03: Repository update returns null (update failed)
    /// Condition tested: if (updatedUser == null) throw InvalidOperationException (line 396-399 in code)
    /// </summary>
    [Fact]
    public async Task UpdateUserAsync_RepositoryReturnsNull_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = "u1";
        var fullname = "Name";
        var roleNumber = "SE000000";
        var role = Role.STUDENT;
        var isEnable = false;

        _userRepositoryMock
            .Setup(r => r.UpdateUserAsync(userId, fullname, roleNumber, role, isEnable))
            .ReturnsAsync((User?)null);

        // Act
        Func<Task> act = async () => await _sut.UpdateUserAsync(userId, fullname, roleNumber, role, isEnable);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Failed to update user");

        _userRepositoryMock.Verify(
            r => r.UpdateUserAsync(userId, fullname, roleNumber, role, isEnable),
            Times.Once
        );
    }

    #endregion

    #region UpdateProfileAsync Tests

    /// <summary>
    /// F021-UTCID01: Valid JWT, all fields provided, repository update succeeds
    /// Condition tested: JwtUtil.VerifyAsync succeeds, UpdateProfileAsync returns non-null (line 413-420 in code)
    /// </summary>
    [Fact]
    public async Task UpdateProfileAsync_ValidJwtAllFieldsProvided_UpdateSucceeds_ReturnsUserProfileResponse()
    {
        // Arrange
        var accessToken = _jwtUtil.GenerateAccessToken(new JwtPayload { Id = "u1", Email = "test@example.com", Role = "User" });
        var fullname = "New Name";
        var birthday = new DateTime(1990, 1, 1);
        var avatarUrl = "https://example.com/avatar.png";

        var updatedUser = new User
        {
            Id = "u1",
            Fullname = fullname,
            Birthday = birthday,
            AvatarUrl = avatarUrl,
            Email = "test@example.com",
            Role = Role.STUDENT,
            IsEnable = true
        };

        _userRepositoryMock
            .Setup(r => r.UpdateProfileAsync("u1", fullname, birthday, avatarUrl))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _sut.UpdateProfileAsync(accessToken, fullname, birthday, avatarUrl);

        // Assert
        result.Should().NotBeNull();
        result.Fullname.Should().Be(fullname);
        result.Birthday.Should().Be(birthday);
        result.AvatarUrl.Should().Be(avatarUrl);

        _userRepositoryMock.Verify(
            r => r.UpdateProfileAsync("u1", fullname, birthday, avatarUrl),
            Times.Once
        );
    }

    /// <summary>
    /// F021-UTCID02: Invalid access token (JwtUtil.VerifyAsync throws exception)
    /// Condition tested: JwtUtil.VerifyAsync throws SecurityTokenException (line 413 in code)
    /// </summary>
    [Fact]
    public async Task UpdateProfileAsync_InvalidToken_ThrowsSecurityTokenException()
    {
        // Arrange
        var invalidToken = "invalid.token.here";
        var fullname = "Name";
        DateTime? birthday = null;
        string? avatarUrl = null;

        // Act
        Func<Task> act = async () => await _sut.UpdateProfileAsync(invalidToken, fullname, birthday, avatarUrl);

        // Assert
        await act.Should().ThrowAsync<Microsoft.IdentityModel.Tokens.SecurityTokenException>()
            .WithMessage("*Invalid token*");

        _userRepositoryMock.Verify(
            r => r.UpdateProfileAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<string?>()),
            Times.Never
        );
    }

    /// <summary>
    /// F021-UTCID03: Repository UpdateProfileAsync returns null (update failed)
    /// Condition tested: if (updatedUser == null) throw InvalidOperationException (line 416-419 in code)
    /// </summary>
    [Fact]
    public async Task UpdateProfileAsync_RepositoryReturnsNull_ThrowsInvalidOperationException()
    {
        // Arrange
        var accessToken = _jwtUtil.GenerateAccessToken(new JwtPayload { Id = "u1", Email = "test@example.com", Role = "User" });
        var fullname = "Name";
        DateTime? birthday = null;
        string? avatarUrl = null;

        _userRepositoryMock
            .Setup(r => r.UpdateProfileAsync("u1", fullname, birthday, avatarUrl))
            .ReturnsAsync((User?)null);

        // Act
        Func<Task> act = async () => await _sut.UpdateProfileAsync(accessToken, fullname, birthday, avatarUrl);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Failed to update profile");

        _userRepositoryMock.Verify(
            r => r.UpdateProfileAsync("u1", fullname, birthday, avatarUrl),
            Times.Once
        );
    }

    /// <summary>
    /// F021-UTCID04: Valid JWT, only birthday provided (null = no update for other fields)
    /// Condition tested: JwtUtil.VerifyAsync succeeds, UpdateProfileAsync returns non-null (line 413-420 in code)
    /// </summary>
    [Fact]
    public async Task UpdateProfileAsync_ValidJwtOnlyBirthdayProvided_UpdateSucceeds_ReturnsUserProfileResponse()
    {
        // Arrange
        var accessToken = _jwtUtil.GenerateAccessToken(new JwtPayload { Id = "u1", Email = "test@example.com", Role = "User" });
        string? fullname = null;
        var birthday = new DateTime(2000, 12, 31);
        string? avatarUrl = null;

        var updatedUser = new User
        {
            Id = "u1",
            Fullname = "Existing Name",
            Birthday = birthday,
            AvatarUrl = string.Empty,
            Email = "test@example.com",
            Role = Role.STUDENT,
            IsEnable = true
        };

        _userRepositoryMock
            .Setup(r => r.UpdateProfileAsync("u1", fullname, birthday, avatarUrl))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _sut.UpdateProfileAsync(accessToken, fullname, birthday, avatarUrl);

        // Assert
        result.Should().NotBeNull();
        result.Birthday.Should().Be(birthday);
        result.Fullname.Should().Be("Existing Name");

        _userRepositoryMock.Verify(
            r => r.UpdateProfileAsync("u1", fullname, birthday, avatarUrl),
            Times.Once
        );
    }

    #endregion

}
