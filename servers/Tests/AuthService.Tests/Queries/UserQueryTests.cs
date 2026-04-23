using AuthService.Application.Mappers;
using AuthService.Application.Queries;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Models;
using AuthService.Repositories.User;
using AuthService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System.IdentityModel.Tokens.Jwt;
using AppJwtPayload = AuthService.Application.Utils.JwtPayload;

namespace AuthService.Tests.Queries;

public class UserQueryTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<ILogger<UserQuery>> _loggerMock;
    private readonly Mock<IGoogleTokenVerifier> _googleTokenVerifierMock;
    private readonly JwtUtil _jwtUtil;
    private readonly UserMapper _userMapper;
    private readonly UserQuery _sut;

    public UserQueryTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _configurationMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<UserQuery>>();
        _googleTokenVerifierMock = new Mock<IGoogleTokenVerifier>();

        _configurationMock.Setup(c => c["Jwt:JwtSecret"]).Returns("valid-32-char-secret-key-here12345678");
        _configurationMock.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns("1d");
        _configurationMock.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns("7d");
        _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("AuthService");
        _configurationMock.Setup(c => c["Jwt:Audience"]).Returns("Acas");
        _configurationMock.Setup(c => c["HashingSecretKey"]).Returns("test-hashing-secret-key-1234567890");

        _jwtUtil = new JwtUtil(_configurationMock.Object);
        _userMapper = new UserMapper();

        // Default: Google verifier returns a valid payload for tests that don't override
        _googleTokenVerifierMock
            .Setup(v => v.VerifyTokenAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload { Email = "default@gmail.com", GoogleId = "default-gid" });

        _sut = new UserQuery(
            _userRepositoryMock.Object,
            _configurationMock.Object,
            _userMapper,
            _jwtUtil,
            _googleTokenVerifierMock.Object,
            _loggerMock.Object
        );
    }

    private static string HashPassword(string password, IConfiguration config)
    {
        return HashingUtil.HashString(password, config);
    }

    #region AuthenticateAsync Tests

    /// <summary>
    /// F022-UTCID01: Valid credentials (user exists, password correct, enabled, not first login)
    /// </summary>
    [Fact]
    public async Task AuthenticateAsync_ValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var email = "user@test.com";
        var password = "correctpass";
        var hashedPassword = HashPassword(password, _configurationMock.Object);

        var user = new User
        {
            Id = "u1",
            Email = email,
            Password = hashedPassword,
            Fullname = "Test User",
            Role = Role.STUDENT,
            IsEnable = true,
            FirstLogin = false
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(email)).ReturnsAsync(user);

        // Act
        var result = await _sut.AuthenticateAsync(new LoginCredentials { Email = email, Password = password });

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.FirstLogin.Should().BeFalse();
        result.UserProfile.Email.Should().Be(email);

        var tokenParts = result.AccessToken.Split('.');
        tokenParts.Length.Should().Be(3);
    }

    /// <summary>
    /// F022-UTCID02: Email does not exist
    /// </summary>
    [Fact]
    public async Task AuthenticateAsync_EmailNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var credentials = new LoginCredentials { Email = "nonexistent@test.com", Password = "pass" };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(credentials.Email)).ReturnsAsync((User?)null);

        // Act
        Func<Task> act = async () => await _sut.AuthenticateAsync(credentials);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid email or password");
    }

    /// <summary>
    /// F022-UTCID03: Wrong password
    /// </summary>
    [Fact]
    public async Task AuthenticateAsync_WrongPassword_ThrowsInvalidOperationException()
    {
        // Arrange
        var email = "user@test.com";
        var correctPassword = "correctpass";
        var wrongPassword = "wrongpass";
        var hashedPassword = HashPassword(correctPassword, _configurationMock.Object);

        var user = new User
        {
            Id = "u1",
            Email = email,
            Password = hashedPassword,
            Role = Role.STUDENT,
            IsEnable = true
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(email)).ReturnsAsync(user);

        // Act
        Func<Task> act = async () => await _sut.AuthenticateAsync(new LoginCredentials { Email = email, Password = wrongPassword });

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid email or password");
    }

    /// <summary>
    /// F022-UTCID04: User is disabled
    /// </summary>
    [Fact]
    public async Task AuthenticateAsync_DisabledUser_ThrowsInvalidOperationException()
    {
        // Arrange
        var email = "disabled@test.com";
        var password = "pass";
        var hashedPassword = HashPassword(password, _configurationMock.Object);

        var user = new User
        {
            Id = "u1",
            Email = email,
            Password = hashedPassword,
            Role = Role.STUDENT,
            IsEnable = false
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(email)).ReturnsAsync(user);

        // Act
        Func<Task> act = async () => await _sut.AuthenticateAsync(new LoginCredentials { Email = email, Password = password });

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User is forbidden");
    }

    /// <summary>
    /// F022-UTCID05: Valid credentials with first login
    /// </summary>
    [Fact]
    public async Task AuthenticateAsync_FirstLoginUser_ReturnsAuthResponseWithFirstLoginTrue()
    {
        // Arrange
        var email = "firstlogin@test.com";
        var password = "pass";
        var hashedPassword = HashPassword(password, _configurationMock.Object);

        var user = new User
        {
            Id = "u1",
            Email = email,
            Password = hashedPassword,
            Fullname = "First Login User",
            Role = Role.STUDENT,
            IsEnable = true,
            FirstLogin = true
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(email)).ReturnsAsync(user);

        // Act
        var result = await _sut.AuthenticateAsync(new LoginCredentials { Email = email, Password = password });

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.FirstLogin.Should().BeTrue();
        result.UserProfile.Email.Should().Be(email);
    }

    #endregion

    #region AuthenticateWithGoogleAsync Tests

    /// <summary>
    /// F023-UTCID01: Valid Google token, user exists, GoogleId matches
    /// </summary>
    [Fact]
    public async Task AuthenticateWithGoogleAsync_ValidTokenUserExistsGoogleIdMatches_ReturnsAuthResponse()
    {
        // Arrange
        var googleEmail = "googleuser@gmail.com";
        var googleId = "google123";
        var idToken = "valid-google-token";

        var googlePayload = new GoogleTokenPayload { Email = googleEmail, GoogleId = googleId };
        _googleTokenVerifierMock.Setup(v => v.VerifyTokenAsync(idToken)).ReturnsAsync(googlePayload);

        var user = new User
        {
            Id = "u1",
            Email = googleEmail,
            GoogleId = googleId,
            Fullname = "Google User",
            Role = Role.STUDENT,
            IsEnable = true
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(googleEmail)).ReturnsAsync(user);

        // Act
        var result = await _sut.AuthenticateWithGoogleAsync(idToken);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.UserProfile.Email.Should().Be(googleEmail);
    }

    /// <summary>
    /// F023-UTCID02: Google token valid but user not found
    /// </summary>
    [Fact]
    public async Task AuthenticateWithGoogleAsync_UserNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var idToken = "valid-google-token";
        var googlePayload = new GoogleTokenPayload { Email = "new@gmail.com", GoogleId = "gid" };
        _googleTokenVerifierMock.Setup(v => v.VerifyTokenAsync(idToken)).ReturnsAsync(googlePayload);

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(googlePayload.Email)).ReturnsAsync((User?)null);

        // Act
        Func<Task> act = async () => await _sut.AuthenticateWithGoogleAsync(idToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User not found with this email");
    }

    /// <summary>
    /// F023-UTCID03: Google token valid but user is disabled
    /// </summary>
    [Fact]
    public async Task AuthenticateWithGoogleAsync_DisabledUser_ThrowsInvalidOperationException()
    {
        // Arrange
        var googleEmail = "user@gmail.com";
        var googleId = "google123";
        var idToken = "valid-google-token";

        var googlePayload = new GoogleTokenPayload { Email = googleEmail, GoogleId = googleId };
        _googleTokenVerifierMock.Setup(v => v.VerifyTokenAsync(idToken)).ReturnsAsync(googlePayload);

        var user = new User
        {
            Id = "u1",
            Email = googleEmail,
            GoogleId = googleId,
            Role = Role.STUDENT,
            IsEnable = false
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(user.Email)).ReturnsAsync(user);

        // Act
        Func<Task> act = async () => await _sut.AuthenticateWithGoogleAsync(idToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User is forbidden");
    }

    /// <summary>
    /// F023-UTCID04: User exists but GoogleId is empty, UpdateGoogleIdAsync succeeds
    /// </summary>
    [Fact]
    public async Task AuthenticateWithGoogleAsync_EmptyGoogleId_UpdatesAndReturnsAuthResponse()
    {
        // Arrange
        var googleEmail = "user@gmail.com";
        var googleId = "gid123";
        var idToken = "valid-google-token";

        var googlePayload = new GoogleTokenPayload { Email = googleEmail, GoogleId = googleId };
        _googleTokenVerifierMock.Setup(v => v.VerifyTokenAsync(idToken)).ReturnsAsync(googlePayload);

        var user = new User
        {
            Id = "u1",
            Email = googleEmail,
            GoogleId = "",
            Fullname = "Google User",
            Role = Role.STUDENT,
            IsEnable = true
        };

        var updatedUser = new User
        {
            Id = "u1",
            Email = googleEmail,
            GoogleId = googleId,
            Fullname = "Google User",
            Role = Role.STUDENT,
            IsEnable = true
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        _userRepositoryMock.Setup(r => r.UpdateGoogleIdAsync("u1", googleId)).ReturnsAsync(updatedUser);

        // Act
        var result = await _sut.AuthenticateWithGoogleAsync(idToken);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();

        _userRepositoryMock.Verify(r => r.UpdateGoogleIdAsync("u1", googleId), Times.Once);
    }

    /// <summary>
    /// F023-UTCID05: GoogleId does not match
    /// </summary>
    [Fact]
    public async Task AuthenticateWithGoogleAsync_GoogleIdMismatch_ThrowsInvalidOperationException()
    {
        // Arrange
        var googleEmail = "user@gmail.com";
        var idToken = "valid-google-token";

        var googlePayload = new GoogleTokenPayload { Email = googleEmail, GoogleId = "gid123" };
        _googleTokenVerifierMock.Setup(v => v.VerifyTokenAsync(idToken)).ReturnsAsync(googlePayload);

        var user = new User
        {
            Id = "u1",
            Email = googleEmail,
            GoogleId = "different-google-id",
            Role = Role.STUDENT,
            IsEnable = true
        };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(user.Email)).ReturnsAsync(user);

        // Act
        Func<Task> act = async () => await _sut.AuthenticateWithGoogleAsync(idToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Google ID does not match this account");
    }

    /// <summary>
    /// F023-UTCID06: Invalid Google token
    /// </summary>
    [Fact]
    public async Task AuthenticateWithGoogleAsync_InvalidToken_ThrowsInvalidOperationException()
    {
        // Arrange
        var idToken = "invalid.google.token";
        _googleTokenVerifierMock.Setup(v => v.VerifyTokenAsync(idToken))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        // Act
        Func<Task> act = async () => await _sut.AuthenticateWithGoogleAsync(idToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid Google token");
    }

    #endregion

    #region GetProfileAsync Tests

    /// <summary>
    /// F024-UTCID01: Valid JWT, user found and enabled
    /// </summary>
    [Fact]
    public async Task GetProfileAsync_ValidTokenUserEnabled_ReturnsUserProfileResponse()
    {
        // Arrange
        var accessToken = _jwtUtil.GenerateAccessToken(new AppJwtPayload { Id = "u1", Email = "test@example.com", Role = "STUDENT" });

        var user = new User
        {
            Id = "u1",
            Email = "test@example.com",
            Fullname = "Test User",
            Role = Role.STUDENT,
            IsEnable = true
        };

        _userRepositoryMock.Setup(r => r.FindByIdAsync("u1")).ReturnsAsync(user);

        // Act
        var result = await _sut.GetProfileAsync(accessToken);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be("u1");
        result.IsEnable.Should().BeTrue();
    }

    /// <summary>
    /// F024-UTCID02: Invalid token
    /// </summary>
    [Fact]
    public async Task GetProfileAsync_InvalidToken_ThrowsSecurityTokenException()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        Func<Task> act = async () => await _sut.GetProfileAsync(invalidToken);

        // Assert
        await act.Should().ThrowAsync<Microsoft.IdentityModel.Tokens.SecurityTokenException>();
    }

    /// <summary>
    /// F024-UTCID03: Valid token but user deleted
    /// </summary>
    [Fact]
    public async Task GetProfileAsync_UserDeleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var accessToken = _jwtUtil.GenerateAccessToken(new AppJwtPayload { Id = "deleted-user", Email = "deleted@test.com", Role = "STUDENT" });

        _userRepositoryMock.Setup(r => r.FindByIdAsync("deleted-user")).ReturnsAsync((User?)null);

        // Act
        Func<Task> act = async () => await _sut.GetProfileAsync(accessToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User not found or inactive");
    }

    /// <summary>
    /// F024-UTCID04: Valid token but user is disabled
    /// </summary>
    [Fact]
    public async Task GetProfileAsync_DisabledUser_ThrowsInvalidOperationException()
    {
        // Arrange
        var accessToken = _jwtUtil.GenerateAccessToken(new AppJwtPayload { Id = "u1", Email = "disabled@test.com", Role = "STUDENT" });

        var user = new User
        {
            Id = "u1",
            Email = "disabled@test.com",
            Role = Role.STUDENT,
            IsEnable = false
        };

        _userRepositoryMock.Setup(r => r.FindByIdAsync("u1")).ReturnsAsync(user);

        // Act
        Func<Task> act = async () => await _sut.GetProfileAsync(accessToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User not found or inactive");
    }

    #endregion

    #region GetAllUsersAsync Tests

    /// <summary>
    /// F025-UTCID01: Users exist in repository
    /// </summary>
    [Fact]
    public async Task GetAllUsersAsync_UsersExist_ReturnsListOfUserProfileResponses()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = "u1", Email = "user1@test.com", Fullname = "User 1", Role = Role.STUDENT, IsEnable = true },
            new User { Id = "u2", Email = "user2@test.com", Fullname = "User 2", Role = Role.LECTURER, IsEnable = true },
            new User { Id = "u3", Email = "user3@test.com", Fullname = "User 3", Role = Role.ADMIN, IsEnable = true }
        };

        _userRepositoryMock.Setup(r => r.FindAllAsync()).ReturnsAsync(users);

        // Act
        var result = await _sut.GetAllUsersAsync();

        // Assert
        result.Should().NotBeNull();
        result.Count.Should().Be(3);
    }

    /// <summary>
    /// F025-UTCID02: No users in repository
    /// </summary>
    [Fact]
    public async Task GetAllUsersAsync_NoUsers_ReturnsEmptyList()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.FindAllAsync()).ReturnsAsync(new List<User>());

        // Act
        var result = await _sut.GetAllUsersAsync();

        // Assert
        result.Should().NotBeNull();
        result.Count.Should().Be(0);
    }

    #endregion

    #region GetPagedUsersAsync Tests

    /// <summary>
    /// F026-UTCID01: No filters
    /// </summary>
    [Fact]
    public async Task GetPagedUsersAsync_NoFilters_ReturnsPagedResult()
    {
        // Arrange
        var users = Enumerable.Range(1, 10).Select(i => new User
        {
            Id = $"u{i}",
            Email = $"user{i}@test.com",
            Fullname = $"User {i}",
            Role = Role.STUDENT,
            IsEnable = true
        }).ToList();

        _userRepositoryMock.Setup(r => r.FindPagedAsync(1, 10, null, null, null))
            .ReturnsAsync((users, 25));

        // Act
        var result = await _sut.GetPagedUsersAsync(1, 10);

        // Assert
        result.Should().NotBeNull();
        result.Items.Count.Should().Be(10);
        result.TotalCount.Should().Be(25);
        result.PageIndex.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// F026-UTCID02: With search term
    /// </summary>
    [Fact]
    public async Task GetPagedUsersAsync_WithSearchTerm_ReturnsFilteredPagedResult()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = "u1", Email = "student@fpt.edu.vn", Fullname = "FPT Student", Role = Role.STUDENT, IsEnable = true },
            new User { Id = "u2", Email = "lecturer@fpt.edu.vn", Fullname = "FPT Lecturer", Role = Role.LECTURER, IsEnable = true }
        };

        _userRepositoryMock.Setup(r => r.FindPagedAsync(1, 10, "@fpt.edu.vn", null, null))
            .ReturnsAsync((users, 2));

        // Act
        var result = await _sut.GetPagedUsersAsync(1, 10, "@fpt.edu.vn");

        // Assert
        result.Should().NotBeNull();
        result.Items.Count.Should().Be(2);
        result.Items.Should().OnlyContain(u => u.Email.Contains("@fpt.edu.vn"));
    }

    /// <summary>
    /// F026-UTCID03: With role filter
    /// </summary>
    [Fact]
    public async Task GetPagedUsersAsync_WithRoleFilter_ReturnsFilteredPagedResult()
    {
        // Arrange
        var users = Enumerable.Range(1, 8).Select(i => new User
        {
            Id = $"u{i}",
            Email = $"student{i}@test.com",
            Fullname = $"Student {i}",
            Role = Role.STUDENT,
            IsEnable = true
        }).ToList();

        _userRepositoryMock.Setup(r => r.FindPagedAsync(1, 10, null, "STUDENT", null))
            .ReturnsAsync((users, 8));

        // Act
        var result = await _sut.GetPagedUsersAsync(1, 10, null, "STUDENT");

        // Assert
        result.Should().NotBeNull();
        result.Items.Count.Should().Be(8);
        result.Items.Should().OnlyContain(u => u.Role == "STUDENT");
    }

    /// <summary>
    /// F026-UTCID04: With is enable filter
    /// </summary>
    [Fact]
    public async Task GetPagedUsersAsync_WithIsEnableFilter_ReturnsFilteredPagedResult()
    {
        // Arrange
        var users = Enumerable.Range(1, 3).Select(i => new User
        {
            Id = $"u{i}",
            Email = $"disabled{i}@test.com",
            Fullname = $"Disabled User {i}",
            Role = Role.STUDENT,
            IsEnable = false
        }).ToList();

        _userRepositoryMock.Setup(r => r.FindPagedAsync(1, 10, null, null, false))
            .ReturnsAsync((users, 3));

        // Act
        var result = await _sut.GetPagedUsersAsync(1, 10, null, null, false);

        // Assert
        result.Should().NotBeNull();
        result.Items.Count.Should().Be(3);
        result.Items.Should().OnlyContain(u => u.IsEnable == false);
    }

    /// <summary>
    /// F026-UTCID05: No match
    /// </summary>
    [Fact]
    public async Task GetPagedUsersAsync_NoMatch_ReturnsEmptyPagedResult()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.FindPagedAsync(1, 10, "xyznotexist999", null, null))
            .ReturnsAsync((new List<User>(), 0));

        // Act
        var result = await _sut.GetPagedUsersAsync(1, 10, "xyznotexist999");

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
    }

    /// <summary>
    /// F026-UTCID06: Second page
    /// </summary>
    [Fact]
    public async Task GetPagedUsersAsync_SecondPage_ReturnsPartialPagedResult()
    {
        // Arrange
        var users = Enumerable.Range(1, 5).Select(i => new User
        {
            Id = $"u{i + 10}",
            Email = $"user{i + 10}@test.com",
            Fullname = $"User {i + 10}",
            Role = Role.STUDENT,
            IsEnable = true
        }).ToList();

        _userRepositoryMock.Setup(r => r.FindPagedAsync(2, 10, null, null, null))
            .ReturnsAsync((users, 25));

        // Act
        var result = await _sut.GetPagedUsersAsync(2, 10);

        // Assert
        result.Should().NotBeNull();
        result.Items.Count.Should().Be(5);
        result.TotalCount.Should().Be(25);
        result.PageIndex.Should().Be(2);
        result.HasPreviousPage.Should().BeTrue();
        result.HasNextPage.Should().BeTrue();
    }

    #endregion

    #region CheckEmailExistsAsync Tests

    /// <summary>
    /// F027-UTCID01: Email exists
    /// </summary>
    [Fact]
    public async Task CheckEmailExistsAsync_EmailExists_ReturnsTrue()
    {
        // Arrange
        var email = "existing@test.com";
        var user = new User { Id = "u1", Email = email, Role = Role.STUDENT, IsEnable = true };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(email)).ReturnsAsync(user);

        // Act
        var result = await _sut.CheckEmailExistsAsync(email);

        // Assert
        result.Should().NotBeNull();
        result.Exists.Should().BeTrue();
        result.Message.Should().BeNull();
    }

    /// <summary>
    /// F027-UTCID02: Email not found
    /// </summary>
    [Fact]
    public async Task CheckEmailExistsAsync_EmailNotFound_ReturnsFalse()
    {
        // Arrange
        var email = "new@test.com";

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(email)).ReturnsAsync((User?)null);

        // Act
        var result = await _sut.CheckEmailExistsAsync(email);

        // Assert
        result.Should().NotBeNull();
        result.Exists.Should().BeFalse();
        result.Message.Should().Be("Email not found in the system");
    }

    /// <summary>
    /// F027-UTCID03: Case insensitive lookup
    /// </summary>
    [Fact]
    public async Task CheckEmailExistsAsync_CaseInsensitiveLookup_ReturnsTrue()
    {
        // Arrange
        var email = "user@FPT.EDU.VN";
        var user = new User { Id = "u1", Email = "user@fpt.edu.vn", Role = Role.STUDENT, IsEnable = true };

        _userRepositoryMock.Setup(r => r.FindByEmailAsync(email)).ReturnsAsync(user);

        // Act
        var result = await _sut.CheckEmailExistsAsync(email);

        // Assert
        result.Should().NotBeNull();
        result.Exists.Should().BeTrue();
        result.Message.Should().BeNull();
    }

    #endregion
}
