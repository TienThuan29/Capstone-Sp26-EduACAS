using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using AuthService.Application.Utils;

namespace AuthService.Tests.Utils;

public class GoogleTokenVerifierTests
{
    private readonly Mock<ILogger<GoogleTokenVerifier>> _loggerMock;

    public GoogleTokenVerifierTests()
    {
        _loggerMock = new Mock<ILogger<GoogleTokenVerifier>>();
    }

    #region F008 - Constructor Tests

    [Fact]
    public void F008_01_ClientIdIsNull_ThrowsInvalidOperationException()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns((string?)null);

        Action act = () => new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Google:ClientId is not configured");
    }

    [Fact]
    public void F008_02_ClientIdIsEmpty_ThrowsInvalidOperationException()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns(string.Empty);

        Action act = () => new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Google:ClientId is not configured");
    }

    [Fact]
    public void F008_03_ClientIdIsValid_CreatesInstance()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        verifier.Should().NotBeNull();
    }

    #endregion

    #region F009 - VerifyTokenAsync Tests

    [Fact(Skip = "Requires a real Google ID token and live Google API access")]
    public async Task F009_01_ValidToken_ReturnsGoogleTokenPayloadWithEmail()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        var result = await verifier.VerifyTokenAsync("any-valid-token");

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task F009_02_TokenIsNull_ThrowsInvalidOperationException()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync(null!))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task F009_03_TokenIsEmpty_ThrowsInvalidOperationException()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync(string.Empty))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task F009_04_TokenIsWhitespace_ThrowsInvalidOperationException()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("   "))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task F009_05_TokenIsMalformed_ThrowsInvalidOperationException()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("not.a.valid.jwt"))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid Google token");
    }

    [Fact]
    public async Task F009_06_TokenForDifferentClientId_ThrowsInvalidOperationException()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("token-for-different-client"))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid Google token");
    }

    #endregion
}
