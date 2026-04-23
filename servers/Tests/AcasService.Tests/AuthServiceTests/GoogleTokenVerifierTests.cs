using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using AuthService.Application.Utils;

namespace AcasService.Tests.AuthServiceTests;

public class GoogleTokenVerifierTests
{
    private readonly Mock<ILogger<GoogleTokenVerifier>> _loggerMock;

    public GoogleTokenVerifierTests()
    {
        _loggerMock = new Mock<ILogger<GoogleTokenVerifier>>();
    }

    private Mock<IGoogleTokenValidator> CreateMockValidator()
    {
        return new Mock<IGoogleTokenValidator>();
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
    public void F008_02_ClientIdIsEmpty_DoesNotThrow()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns(string.Empty);

        Action act = () => new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        act.Should().NotThrow();
    }

    [Fact]
    public void F008_03_ClientIdIsValid_CreatesInstance()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Google:ClientId"]).Returns("valid-client-id");

        var verifier = new GoogleTokenVerifier(configMock.Object, _loggerMock.Object);

        verifier.Should().NotBeNull();
    }

    [Fact]
    public void F008_03_ValidTokenVerifier_CreatesInstance()
    {
        var mockValidator = CreateMockValidator();
        var verifier = new GoogleTokenVerifier(mockValidator.Object);
        verifier.Should().NotBeNull();
    }

    #endregion

    #region F009 - VerifyTokenAsync Tests

    [Fact]
    public async Task F009_01_ValidToken_ReturnsGoogleTokenPayloadWithEmail()
    {
        var mockValidator = CreateMockValidator();
        var expectedPayload = new GoogleTokenPayload
        {
            Email = "user@gmail.com",
            GoogleId = "gid123",
            Name = "Test User",
            Picture = "https://pic.url"
        };
        mockValidator.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(expectedPayload);

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        var result = await verifier.VerifyTokenAsync("any-valid-token");

        result.Should().NotBeNull();
        result.Email.Should().Be("user@gmail.com");
        mockValidator.Verify(v => v.VerifyAsync("any-valid-token"), Times.Once);
    }

    [Fact]
    public async Task F009_02_ValidToken_ReturnsGoogleTokenPayloadWithGoogleId()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload { Email = "test@gmail.com", GoogleId = "gid123" });

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        var result = await verifier.VerifyTokenAsync("token");

        result.GoogleId.Should().Be("gid123");
    }

    [Fact]
    public async Task F009_03_ValidToken_ReturnsGoogleTokenPayloadWithNameAndPicture()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync(It.IsAny<string>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Email = "test@gmail.com",
                GoogleId = "gid",
                Name = "Test Name",
                Picture = "https://example.com/pic.jpg"
            });

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        var result = await verifier.VerifyTokenAsync("token");

        result.Name.Should().Be("Test Name");
        result.Picture.Should().Be("https://example.com/pic.jpg");
    }

    [Fact]
    public async Task F009_04_TokenIsNull_ThrowsInvalidOperationException()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync(null!))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync(null!))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task F009_05_TokenIsEmpty_ThrowsInvalidOperationException()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync(string.Empty))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync(string.Empty))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task F009_06_TokenIsWhitespace_ThrowsInvalidOperationException()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync("   "))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("   "))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task F009_07_TokenIsMalformed_ThrowsInvalidOperationException()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync("not.a.valid.jwt"))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("not.a.valid.jwt"))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid Google token");
    }

    [Fact]
    public async Task F009_08_TokenForDifferentClientId_ThrowsInvalidOperationException()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync("token-for-different-client"))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("token-for-different-client"))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid Google token");
    }

    [Fact]
    public async Task F009_09_ExpiredToken_ThrowsInvalidOperationException()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync("expired-google-token"))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("expired-google-token"))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid Google token");
    }

    [Fact]
    public async Task F009_10_TokenWithOnlyTwoParts_ThrowsInvalidOperationException()
    {
        var mockValidator = CreateMockValidator();
        mockValidator.Setup(v => v.VerifyAsync("only.two.parts"))
            .ThrowsAsync(new InvalidOperationException("Invalid Google token"));

        var verifier = new GoogleTokenVerifier(mockValidator.Object);

        await verifier.Invoking(v => v.VerifyTokenAsync("only.two.parts"))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    #endregion
}
