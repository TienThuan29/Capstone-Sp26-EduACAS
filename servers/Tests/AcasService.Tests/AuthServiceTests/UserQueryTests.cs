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
using Microsoft.IdentityModel.Tokens;

namespace AcasService.Tests.AuthServiceTests;

public class UserQueryTests
{
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<IConfiguration> _configMock;
    private readonly Mock<ILogger<UserQuery>> _loggerMock;
    private readonly Mock<IGoogleTokenValidator> _googleValidatorMock;
    private readonly JwtUtil _jwtUtil;
    private readonly UserMapper _userMapper;

    public UserQueryTests()
    {
        _userRepoMock = new Mock<IUserRepository>();
        _configMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<UserQuery>>();
        _googleValidatorMock = new Mock<IGoogleTokenValidator>();
        _jwtUtil = CreateJwtUtil();
        _userMapper = new UserMapper();
        _configMock.Setup(c => c["HashingSecretKey"]).Returns("test-hashing-secret-key-for-unit-tests-64-chars-minimum");
    }

    private static IConfiguration CreateConfiguration(string secretKey)
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["Jwt:JwtSecret"]).Returns(secretKey);
        config.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns("1d");
        config.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns("7d");
        config.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        config.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
        config.Setup(c => c["HashingSecretKey"]).Returns("test-hashing-secret-key-for-unit-tests-64-chars-minimum");
        return config.Object;
    }

    private static JwtUtil CreateJwtUtil(string secret = "test-jwt-secret-key-that-is-long-enough-32-chars")
    {
        return new JwtUtil(CreateConfiguration(secret));
    }

    private UserQuery CreateSystemUnderTest(
        Mock<IUserRepository>? userRepoMock = null,
        IConfiguration? config = null)
    {
        var userRepo = userRepoMock?.Object ?? _userRepoMock.Object;
        var cfg = config ?? _configMock.Object;
        return new UserQuery(userRepo, cfg, _userMapper, _jwtUtil, _googleValidatorMock.Object, _loggerMock.Object);
    }

    private static User CreateTestUser(
        string id = "user-1",
        string email = "test@fpt.edu.vn",
        string passwordHash = "hashedpassword",
        bool isEnable = true,
        bool firstLogin = false,
        Role role = Role.STUDENT,
        string googleId = "")
    {
        return new User
        {
            Id = id,
            Email = email,
            Password = passwordHash,
            Fullname = "Test User",
            IsEnable = isEnable,
            FirstLogin = firstLogin,
            Role = role,
            GoogleId = googleId
        };
    }

    private static string HashPassword(string password, IConfiguration config)
    {
        return HashingUtil.HashString(password, config);
    }

    #region F022 - AuthenticateAsync Tests

    [Fact]
    public async Task F022_01_ValidCredentials_ReturnsAuthResponse()
    {
        var password = "password123";
        var passwordHash = HashPassword(password, _configMock.Object);

        var user = CreateTestUser(
            id: "user-001",
            email: "student@fpt.edu.vn",
            passwordHash: passwordHash,
            isEnable: true,
            firstLogin: false,
            role: Role.STUDENT);

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("student@fpt.edu.vn"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);
        var credentials = new LoginCredentials { Email = "student@fpt.edu.vn", Password = password };

        var result = await sut.AuthenticateAsync(credentials);

        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.FirstLogin.Should().BeFalse();
        result.UserProfile.Should().NotBeNull();
        result.UserProfile.Id.Should().Be("user-001");
        result.UserProfile.Email.Should().Be("student@fpt.edu.vn");
    }

    [Fact]
    public async Task F022_02_EmailNotFound_ThrowsInvalidOperationException()
    {
        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var sut = CreateSystemUnderTest(userRepoMock);
        var credentials = new LoginCredentials { Email = "notfound@fpt.edu.vn", Password = "password123" };

        var act = async () => await sut.AuthenticateAsync(credentials);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid email or password");
    }

    [Fact]
    public async Task F022_03_WrongPassword_ThrowsInvalidOperationException()
    {
        var correctPassword = "correctpassword";
        var passwordHash = HashPassword(correctPassword, _configMock.Object);

        var user = CreateTestUser(
            email: "student@fpt.edu.vn",
            passwordHash: passwordHash,
            isEnable: true);

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("student@fpt.edu.vn"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);
        var credentials = new LoginCredentials { Email = "student@fpt.edu.vn", Password = "wrongpassword" };

        var act = async () => await sut.AuthenticateAsync(credentials);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid email or password");
    }

    [Fact]
    public async Task F022_04_UserDisabled_ThrowsInvalidOperationException()
    {
        var passwordHash = HashPassword("password123", _configMock.Object);

        var user = CreateTestUser(
            email: "disabled@fpt.edu.vn",
            passwordHash: passwordHash,
            isEnable: false);

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("disabled@fpt.edu.vn"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);
        var credentials = new LoginCredentials { Email = "disabled@fpt.edu.vn", Password = "password123" };

        var act = async () => await sut.AuthenticateAsync(credentials);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User is forbidden");
    }

    [Fact]
    public async Task F022_05_FirstLoginTrue_ReturnsAuthResponseWithFirstLoginTrue()
    {
        var password = "password123";
        var passwordHash = HashPassword(password, _configMock.Object);

        var user = CreateTestUser(
            id: "user-002",
            email: "newuser@fpt.edu.vn",
            passwordHash: passwordHash,
            isEnable: true,
            firstLogin: true,
            role: Role.LECTURER);

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("newuser@fpt.edu.vn"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);
        var credentials = new LoginCredentials { Email = "newuser@fpt.edu.vn", Password = password };

        var result = await sut.AuthenticateAsync(credentials);

        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.FirstLogin.Should().BeTrue();
        result.UserProfile.Should().NotBeNull();
        result.UserProfile.Id.Should().Be("user-002");
    }

    #endregion

    #region F023 - AuthenticateWithGoogleAsync Tests

    [Fact]
    public async Task F023_01_UserFoundWithMatchingGoogleId_ReturnsAuthResponse()
    {
        var googleId = "google-12345";
        var user = CreateTestUser(
            id: "user-google-001",
            email: "googleuser@fpt.edu.vn",
            isEnable: true,
            googleId: googleId);

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("googleuser@fpt.edu.vn"))
            .ReturnsAsync(user);

        _googleValidatorMock.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Email = "googleuser@fpt.edu.vn",
                GoogleId = googleId,
                Name = "Google User",
                Picture = "https://pic.url"
            });

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.AuthenticateWithGoogleAsync("valid-google-token");

        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.UserProfile.Should().NotBeNull();
        _googleValidatorMock.Verify(v => v.VerifyAsync("valid-google-token"), Times.Once);
    }

    [Fact]
    public async Task F023_02_UserNotFoundByEmail_ThrowsInvalidOperationException()
    {
        _googleValidatorMock.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Email = "notfound@gmail.com",
                GoogleId = "gid123"
            });

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("notfound@gmail.com"))
            .ReturnsAsync((User?)null);

        var sut = CreateSystemUnderTest(userRepoMock);

        var act = async () => await sut.AuthenticateWithGoogleAsync("google-token");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User not found with this email");
    }

    [Fact]
    public async Task F023_03_UserFoundButDisabled_ThrowsInvalidOperationException()
    {
        _googleValidatorMock.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Email = "disabled-google@fpt.edu.vn",
                GoogleId = "google-12345"
            });

        var user = CreateTestUser(
            email: "disabled-google@fpt.edu.vn",
            isEnable: false,
            googleId: "google-12345");

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("disabled-google@fpt.edu.vn"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);

        var act = async () => await sut.AuthenticateWithGoogleAsync("google-token");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User is forbidden");
    }

    [Fact]
    public async Task F023_04_GoogleIdMismatch_ThrowsInvalidOperationException()
    {
        _googleValidatorMock.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Email = "google-mismatch@fpt.edu.vn",
                GoogleId = "different-google-id"
            });

        var user = CreateTestUser(
            email: "google-mismatch@fpt.edu.vn",
            isEnable: true,
            googleId: "original-google-id");

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("google-mismatch@fpt.edu.vn"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);

        var act = async () => await sut.AuthenticateWithGoogleAsync("google-token");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Google ID does not match this account");
    }

    [Fact]
    public async Task F023_05_UserFoundWithEmptyGoogleId_UpdatesGoogleIdAndReturnsAuthResponse()
    {
        var googleId = "new-google-12345";
        var user = CreateTestUser(
            id: "user-google-002",
            email: "newgoogleuser@fpt.edu.vn",
            isEnable: true,
            googleId: "");

        var updatedUser = CreateTestUser(
            id: "user-google-002",
            email: "newgoogleuser@fpt.edu.vn",
            isEnable: true,
            googleId: googleId);

        _googleValidatorMock.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Email = "newgoogleuser@fpt.edu.vn",
                GoogleId = googleId
            });

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByEmailAsync("newgoogleuser@fpt.edu.vn"))
            .ReturnsAsync(user);
        userRepoMock.Setup(x => x.UpdateGoogleIdAsync("user-google-002", googleId))
            .ReturnsAsync(updatedUser);

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.AuthenticateWithGoogleAsync("google-token");

        result.Should().NotBeNull();
        result.UserProfile.Should().NotBeNull();
        userRepoMock.Verify(x => x.UpdateGoogleIdAsync("user-google-002", googleId), Times.Once);
    }

    [Fact]
    public async Task F023_06_InvalidGoogleToken_ThrowsInvalidOperationException()
    {
        _googleValidatorMock.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var sut = CreateSystemUnderTest();

        var act = async () => await sut.AuthenticateWithGoogleAsync("invalid-google-token");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid Google token");
    }

    #endregion

    #region F024 - GetProfileAsync Tests

    [Fact]
    public async Task F024_01_ValidTokenAndActiveUser_ReturnsUserProfileResponse()
    {
        var user = CreateTestUser(id: "u1", isEnable: true);

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByIdAsync("u1"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);
        var validToken = _jwtUtil.GenerateAccessToken(new JwtPayload { Id = "u1", Email = "u1@test.com", Role = "STUDENT" });

        var result = await sut.GetProfileAsync(validToken);

        result.Should().NotBeNull();
        result.Id.Should().Be("u1");
        result.IsEnable.Should().BeTrue();
    }

    [Fact]
    public async Task F024_02_InvalidToken_ThrowsSecurityTokenException()
    {
        var sut = CreateSystemUnderTest();

        var act = async () => await sut.GetProfileAsync("invalid.token");

        await act.Should().ThrowAsync<SecurityTokenException>();
    }

    [Fact]
    public async Task F024_03_UserNotFound_ReturnsInvalidOperationException()
    {
        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByIdAsync("deleted-user"))
            .ReturnsAsync((User?)null);

        var sut = CreateSystemUnderTest(userRepoMock);
        var validToken = _jwtUtil.GenerateAccessToken(new JwtPayload { Id = "deleted-user", Email = "del@test.com", Role = "STUDENT" });

        var act = async () => await sut.GetProfileAsync(validToken);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User not found or inactive");
    }

    [Fact]
    public async Task F024_04_UserDisabled_ReturnsInvalidOperationException()
    {
        var user = CreateTestUser(id: "disabled-u1", isEnable: false);

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindByIdAsync("disabled-u1"))
            .ReturnsAsync(user);

        var sut = CreateSystemUnderTest(userRepoMock);
        var validToken = _jwtUtil.GenerateAccessToken(new JwtPayload { Id = "disabled-u1", Email = "dis@test.com", Role = "STUDENT" });

        var act = async () => await sut.GetProfileAsync(validToken);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User not found or inactive");
    }

    #endregion

    #region F025 - GetAllUsersAsync Tests

    [Fact]
    public async Task F025_01_FindAllReturnsList_ReturnsUserProfileListWithCount3()
    {
        var users = new List<User>
        {
            CreateTestUser(id: "u1", email: "u1@test.com"),
            CreateTestUser(id: "u2", email: "u2@test.com"),
            CreateTestUser(id: "u3", email: "u3@test.com")
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindAllAsync())
            .ReturnsAsync(users);

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetAllUsersAsync();

        result.Should().NotBeNull();
        result.Should().HaveCount(3);
    }

    [Fact]
    public async Task F025_02_FindAllReturnsEmpty_ReturnsEmptyList()
    {
        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindAllAsync())
            .ReturnsAsync(new List<User>());

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetAllUsersAsync();

        result.Should().NotBeNull();
        result.Should().HaveCount(0);
    }

    #endregion

    #region F026 - GetPagedUsersAsync Tests

    [Fact]
    public async Task F026_01_PageReturnsData_ReturnsPagedResultWithItems10AndTotal25()
    {
        var users = Enumerable.Range(1, 10).Select(i => CreateTestUser(id: $"u{i}", email: $"u{i}@test.com")).ToList();

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindPagedAsync(10, 10, null, null, null))
            .ReturnsAsync((users, 25));

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetPagedUsersAsync(10, 10);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(25);
    }

    [Fact]
    public async Task F026_02_SearchTermFilter_ReturnsFilteredResults()
    {
        var users = new List<User>
        {
            CreateTestUser(id: "u1", email: "student@fpt.edu.vn"),
            CreateTestUser(id: "u2", email: "lecturer@fpt.edu.vn")
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindPagedAsync(10, 10, "@fpt.edu.vn", null, null))
            .ReturnsAsync((users, 2));

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetPagedUsersAsync(10, 10, "@fpt.edu.vn");

        result.Should().NotBeNull();
        result.Items.Should().OnlyContain(u => u.Email.Contains("@fpt.edu.vn"));
    }

    [Fact]
    public async Task F026_03_RoleFilter_ReturnsFilteredResults()
    {
        var users = new List<User>
        {
            CreateTestUser(id: "u1", email: "s1@fpt.edu.vn", role: Role.STUDENT),
            CreateTestUser(id: "u2", email: "s2@fpt.edu.vn", role: Role.STUDENT)
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindPagedAsync(10, 10, null, "STUDENT", null))
            .ReturnsAsync((users, 2));

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetPagedUsersAsync(10, 10, null, "STUDENT");

        result.Should().NotBeNull();
        result.Items.Should().OnlyContain(u => u.Role == "STUDENT");
    }

    [Fact]
    public async Task F026_04_IsEnableFilter_ReturnsFilteredResults()
    {
        var users = new List<User>
        {
            CreateTestUser(id: "u1", email: "d1@fpt.edu.vn", isEnable: false),
            CreateTestUser(id: "u2", email: "d2@fpt.edu.vn", isEnable: false)
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindPagedAsync(10, 10, null, null, false))
            .ReturnsAsync((users, 2));

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetPagedUsersAsync(10, 10, null, null, false);

        result.Should().NotBeNull();
        result.Items.Should().OnlyContain(u => u.IsEnable == false);
    }

    [Fact]
    public async Task F026_05_NoResults_ReturnsEmptyItemsWithTotal0()
    {
        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindPagedAsync(10, 10, "xyznotexist999", null, null))
            .ReturnsAsync((new List<User>(), 0));

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetPagedUsersAsync(10, 10, "xyznotexist999");

        result.Should().NotBeNull();
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task F026_06_DifferentPage_ReturnsItems5AndTotal25()
    {
        var users = Enumerable.Range(1, 5).Select(i => CreateTestUser(id: $"u{i}", email: $"u{i}@test.com")).ToList();

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(x => x.FindPagedAsync(10, 10, null, null, null))
            .ReturnsAsync((users, 25));

        var sut = CreateSystemUnderTest(userRepoMock);

        var result = await sut.GetPagedUsersAsync(10, 10);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(5);
        result.TotalCount.Should().Be(25);
    }

    #endregion
}
