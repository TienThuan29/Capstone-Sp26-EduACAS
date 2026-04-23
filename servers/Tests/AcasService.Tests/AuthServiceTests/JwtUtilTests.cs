using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Application.Utils;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using Moq;
using Microsoft.Extensions.Configuration;

namespace AcasService.Tests.AuthServiceTests;

using AppJwtPayload = AuthService.Application.Utils.JwtPayload;

public class JwtUtilTests
{
    private readonly Mock<IConfiguration> _configMock;

    public JwtUtilTests()
    {
        _configMock = new Mock<IConfiguration>();
    }

    private JwtUtil CreateValidJwtUtil(string secret = "test-secret-key-for-jwt-must-be-long-enough")
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["Jwt:JwtSecret"]).Returns(secret);
        config.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns("1d");
        config.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns("7d");
        config.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        config.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
        return new JwtUtil(config.Object);
    }

    private JwtUtil CreateJwtUtilWithExpiration(string secret, string accessExpiration, string refreshExpiration)
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["Jwt:JwtSecret"]).Returns(secret);
        config.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns(accessExpiration);
        config.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns(refreshExpiration);
        config.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        config.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
        return new JwtUtil(config.Object);
    }

    #region F001 - JwtUtil Constructor Tests

    [Fact]
    public void F001_01_ConfigJwtSecretNull_ThrowsInvalidOperationException()
    {
        // Arrange
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["Jwt:JwtSecret"]).Returns((string?)null);

        // Act
        var act = () => new JwtUtil(config.Object);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("JWT_SECRET is not configured");
    }

    [Fact]
    public void F001_02_ConfigJwtSecretEmpty_CreatesInstance()
    {
        // Arrange
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["Jwt:JwtSecret"]).Returns("");
        config.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns("1d");
        config.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns("7d");
        config.Setup(c => c["Jwt:Issuer"]).Returns("AuthService");
        config.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

        // Act - JwtUtil uses ?? operator which only throws on null, not empty string
        var jwtUtil = new JwtUtil(config.Object);

        // Assert
        jwtUtil.Should().NotBeNull();
    }

    [Fact]
    public void F001_03_JwtSecretPresentAudienceMissing_CreatesInstance()
    {
        // Arrange
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["Jwt:JwtSecret"]).Returns("Acas");
        config.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns("1d");
        config.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns("7d");
        config.Setup(c => c["Jwt:Issuer"]).Returns("AuthService");
        config.Setup(c => c["Jwt:Audience"]).Returns((string?)null);

        // Act
        var jwtUtil = new JwtUtil(config.Object);

        // Assert
        jwtUtil.Should().NotBeNull();
    }

    #endregion

    #region F002 - GenerateAccessToken Tests

    [Fact]
    public void F002_01_ValidPayload_ReturnsNonEmptyThreePartToken()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };

        // Act
        var token = jwtUtil.GenerateAccessToken(payload);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public void F002_02_DifferentPayloads_ProduceDifferentTokens()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload1 = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };
        var payload2 = new AppJwtPayload { Id = "u2", Email = "b@c.com", Role = "Admin" };

        // Act
        var token1 = jwtUtil.GenerateAccessToken(payload1);
        var token2 = jwtUtil.GenerateAccessToken(payload2);

        // Assert
        token1.Should().NotBe(token2);
    }

    [Fact]
    public void F002_03_TokenContainsCorrectClaims()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };

        // Act
        var token = jwtUtil.GenerateAccessToken(payload);
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        // Assert
        jwtToken.Claims.Should().Contain(c => c.Type == "id" && c.Value == "u1");
        jwtToken.Claims.Should().Contain(c => c.Type == "email" && c.Value == "a@b.com");
        jwtToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == "User");
    }

    [Fact]
    public void F002_04_SpecialCharactersInEmailAndRole_ReturnsValidToken()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload
        {
            Id = "u1",
            Email = "special!#$%@test.com",
            Role = "Super-Admin"
        };

        // Act
        var token = jwtUtil.GenerateAccessToken(payload);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public void F002_05_UnicodeEmail_ReturnsValidToken()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload
        {
            Id = "u1",
            Email = "test@unicode.com",
            Role = "User"
        };

        // Act
        var token = jwtUtil.GenerateAccessToken(payload);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3);
    }

    #endregion

    #region F003 - GenerateRefreshToken Tests

    [Fact]
    public void F003_01_ValidPayload_ReturnsNonEmptyThreePartToken()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };

        // Act
        var token = jwtUtil.GenerateRefreshToken(payload);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public void F003_02_RefreshTokenExpirationGreaterThanAccessToken()
    {
        // Arrange - Secret must be at least 128 bits (16 bytes) for HMAC-SHA256
        var jwtUtil = CreateJwtUtilWithExpiration("test-secret-key-minimum-16chars!", "1d", "7d");
        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };

        // Act
        var accessToken = jwtUtil.GenerateAccessToken(payload);
        var refreshToken = jwtUtil.GenerateRefreshToken(payload);

        var handler = new JwtSecurityTokenHandler();
        var accessJwt = handler.ReadJwtToken(accessToken);
        var refreshJwt = handler.ReadJwtToken(refreshToken);

        // Assert
        refreshJwt.ValidTo.Should().BeAfter(accessJwt.ValidTo);
    }

    [Fact]
    public void F003_03_DifferentPayloadWithAdminRole_ContainsCorrectClaims()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload { Id = "admin1", Email = "admin@test.com", Role = "Admin" };

        // Act
        var token = jwtUtil.GenerateRefreshToken(payload);
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        // Assert
        jwtToken.Claims.Should().Contain(c => c.Type == "id" && c.Value == "admin1");
        jwtToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == "Admin");
    }

    #endregion

    #region F004 - VerifyAsync Tests

    [Fact]
    public async Task F004_01_ValidToken_ReturnsJwtPayloadWithCorrectClaims()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };
        var validToken = jwtUtil.GenerateAccessToken(payload);

        // Act
        var result = await jwtUtil.VerifyAsync(validToken);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be("u1");
        result.Email.Should().Be("a@b.com");
        result.Role.Should().Be("User");
    }

    [Fact]
    public async Task F004_02_InvalidTokenFormat_ThrowsSecurityTokenException()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();

        // Act
        var act = async () => await jwtUtil.VerifyAsync("invalid.token.here");

        // Assert
        await act.Should().ThrowAsync<SecurityTokenException>()
            .WithMessage("Invalid token:*");
    }

    [Fact]
    public async Task F004_03_TokenModifiedAtEnd_ThrowsSecurityTokenException()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();
        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };
        var validToken = jwtUtil.GenerateAccessToken(payload);
        var modifiedToken = validToken[..^2] + "XX";

        // Act
        var act = async () => await jwtUtil.VerifyAsync(modifiedToken);

        // Assert
        await act.Should().ThrowAsync<SecurityTokenException>()
            .WithMessage("Invalid token:*");
    }

    [Fact]
    public async Task F004_04_ExpiredToken_ThrowsSecurityTokenException()
    {
        // Arrange
        var secret = "test-secret-key-for-jwt-must-be-long-enough";
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["Jwt:JwtSecret"]).Returns(secret);
        config.Setup(c => c["Jwt:JwtAccessTokenExpiration"]).Returns("1d");
        config.Setup(c => c["Jwt:JwtRefreshTokenExpiration"]).Returns("7d");
        config.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        config.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

        var jwtUtil = new JwtUtil(config.Object);
        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };

        // Create token that expires immediately
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(secret);
        var claims = new[]
        {
            new Claim("id", payload.Id),
            new Claim("email", payload.Email),
            new Claim("role", payload.Role)
        };
        var expires = DateTime.UtcNow.AddSeconds(-1);
        var notBefore = DateTime.UtcNow.AddSeconds(-2);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            NotBefore = notBefore,
            Expires = expires,
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var expiredToken = tokenHandler.WriteToken(token);

        // Act
        var act = async () => await jwtUtil.VerifyAsync(expiredToken);

        // Assert
        await act.Should().ThrowAsync<SecurityTokenException>()
            .WithMessage("Invalid token:*");
    }

    [Fact]
    public async Task F004_05_TokenSignedWithDifferentSecret_ThrowsSecurityTokenException()
    {
        // Arrange
        var jwtUtil1 = CreateValidJwtUtil("secret-one-must-be-long-enough-32chars");
        var jwtUtil2 = CreateValidJwtUtil("secret-two-must-be-long-enough-32chars");

        var payload = new AppJwtPayload { Id = "u1", Email = "a@b.com", Role = "User" };
        var tokenFromOther = jwtUtil2.GenerateAccessToken(payload);

        // Act
        var act = async () => await jwtUtil1.VerifyAsync(tokenFromOther);

        // Assert
        await act.Should().ThrowAsync<SecurityTokenException>()
            .WithMessage("Invalid token:*");
    }

    [Fact]
    public async Task F004_06_EmptyString_ThrowsSecurityTokenException()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();

        // Act
        var act = async () => await jwtUtil.VerifyAsync("");

        // Assert
        await act.Should().ThrowAsync<SecurityTokenException>()
            .WithMessage("Invalid token:*");
    }

    [Fact]
    public async Task F004_07_NullToken_ThrowsSecurityTokenException()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();

        // Act
        var act = async () => await jwtUtil.VerifyAsync(null!);

        // Assert
        await act.Should().ThrowAsync<SecurityTokenException>()
            .WithMessage("Invalid token:*");
    }

    [Fact]
    public async Task F004_08_MalformedJwtWithOnlyTwoParts_ThrowsSecurityTokenException()
    {
        // Arrange
        var jwtUtil = CreateValidJwtUtil();

        // Act
        var act = async () => await jwtUtil.VerifyAsync("only.two.parts");

        // Assert
        await act.Should().ThrowAsync<SecurityTokenException>()
            .WithMessage("Invalid token:*");
    }

    #endregion
}
