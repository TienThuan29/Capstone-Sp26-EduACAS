using AuthService.Application.Utils;
using FluentAssertions;
using Moq;
using Microsoft.Extensions.Configuration;

namespace AuthService.Tests.Utils;

public class HashingUtilTests
{
    private readonly Mock<IConfiguration> _configMock;
    private const string ValidSecretKey = "test-secret-key-for-hashing-minimum-64-chars-required-here";

    public HashingUtilTests()
    {
        _configMock = new Mock<IConfiguration>();
        _configMock.Setup(c => c["HashingSecretKey"]).Returns(ValidSecretKey);
    }

    private Mock<IConfiguration> CreateConfigWithSecret(string? secretKey)
    {
        var config = new Mock<IConfiguration>();
        config.Setup(c => c["HashingSecretKey"]).Returns(secretKey);
        return config;
    }

    #region F005 - HashString Tests

    [Fact]
    public void F005_01_ValidInput_Returns64CharLowercaseHex()
    {
        // Arrange
        const string input = "test-password";

        // Act
        var hash = HashingUtil.HashString(input, _configMock.Object);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void F005_02_SameInputTwice_ProducesSameHash()
    {
        // Arrange
        const string input = "test-password";

        // Act
        var hash1 = HashingUtil.HashString(input, _configMock.Object);
        var hash2 = HashingUtil.HashString(input, _configMock.Object);

        // Assert
        hash1.Should().Be(hash2);
    }

    [Fact]
    public void F005_03_DifferentInputs_ProduceDifferentHashes()
    {
        // Arrange
        const string input1 = "password_a";
        const string input2 = "password_b";

        // Act
        var hash1 = HashingUtil.HashString(input1, _configMock.Object);
        var hash2 = HashingUtil.HashString(input2, _configMock.Object);

        // Assert
        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void F005_04_HashIsNotSameAsInput()
    {
        // Arrange
        const string input = "test-password";

        // Act
        var hash = HashingUtil.HashString(input, _configMock.Object);

        // Assert
        hash.Should().NotBe(input);
    }

    [Fact]
    public void F005_05_UnicodeInput_Returns64CharHash()
    {
        // Arrange
        const string input = "Unicode: 中文测试 français €";

        // Act
        var hash = HashingUtil.HashString(input, _configMock.Object);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void F005_06_EmptyStringInput_Returns64CharHash()
    {
        // Arrange
        const string input = "";

        // Act
        var hash = HashingUtil.HashString(input, _configMock.Object);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void F005_07_WhitespaceInput_Returns64CharHash()
    {
        // Arrange
        const string input = "   ";

        // Act
        var hash = HashingUtil.HashString(input, _configMock.Object);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void F005_08_SameInputProducesSameHash_EquivalentToF005_02()
    {
        // Arrange
        const string input = "consistent-password";

        // Act
        var hash1 = HashingUtil.HashString(input, _configMock.Object);
        var hash2 = HashingUtil.HashString(input, _configMock.Object);

        // Assert
        hash1.Should().Be(hash2);
    }

    [Fact]
    public void F005_09_SecretKeyNull_ThrowsInvalidOperationException()
    {
        // Arrange
        var config = CreateConfigWithSecret(null);

        // Act
        var act = () => HashingUtil.HashString("test", config.Object);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("HASHING_SECRET_KEY is not configured");
    }

    [Fact]
    public void F005_10_SecretKeyEmpty_ThrowsInvalidOperationException()
    {
        // Arrange
        var config = CreateConfigWithSecret("");

        // Act
        var act = () => HashingUtil.HashString("test", config.Object);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("HASHING_SECRET_KEY is not configured");
    }

    #endregion

    #region F006 - VerifyHash Tests

    [Fact]
    public void F006_01_CorrectPasswordAndHash_ReturnsTrue()
    {
        // Arrange
        const string password = "correctpassword";
        var hash = HashingUtil.HashString(password, _configMock.Object);

        // Act
        var result = HashingUtil.VerifyHash(password, hash, _configMock.Object);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void F006_02_WrongPassword_ReturnsFalse()
    {
        // Arrange
        const string correctPassword = "correctpassword";
        const string wrongPassword = "wrongpassword";
        var hash = HashingUtil.HashString(correctPassword, _configMock.Object);

        // Act
        var result = HashingUtil.VerifyHash(wrongPassword, hash, _configMock.Object);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void F006_03_WrongLengthHash_ReturnsFalse()
    {
        // Arrange
        const string password = "password";
        var wrongHash = "aaa" + new string('b', 61);

        // Act
        var result = HashingUtil.VerifyHash(password, wrongHash, _configMock.Object);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void F006_04_SameInputDifferentSecret_ReturnsFalse()
    {
        // Arrange
        const string password = "same-password";
        var hashWithSecret1 = HashingUtil.HashString(password, _configMock.Object);

        var config2 = CreateConfigWithSecret("different-secret-key-for-hashing-64-chars-required!");
        config2.Setup(c => c["HashingSecretKey"]).Returns("different-secret-key-for-hashing-64-chars-required!");

        // Act
        var result = HashingUtil.VerifyHash(password, hashWithSecret1, config2.Object);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void F006_05_CaseSensitivity_ReturnsFalse()
    {
        // Arrange
        const string passwordLower = "password";
        const string passwordUpper = "PASSWORD";
        var hash = HashingUtil.HashString(passwordLower, _configMock.Object);

        // Act
        var result = HashingUtil.VerifyHash(passwordUpper, hash, _configMock.Object);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void F006_06_EmptyHash_ReturnsFalse()
    {
        // Arrange
        const string password = "password";
        const string emptyHash = "";

        // Act
        var result = HashingUtil.VerifyHash(password, emptyHash, _configMock.Object);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void F006_07_NonHexStringWithZeros_ReturnsFalse()
    {
        // Arrange
        const string password = "password";
        var nonHexHash = "not-hex-string" + new string('0', 52);

        // Act
        var result = HashingUtil.VerifyHash(password, nonHexHash, _configMock.Object);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void F006_08_TrailingSpace_ReturnsFalse()
    {
        // Arrange
        const string passwordNoSpace = "pass";
        const string passwordWithSpace = "pass ";
        var hash = HashingUtil.HashString(passwordNoSpace, _configMock.Object);

        // Act
        var result = HashingUtil.VerifyHash(passwordWithSpace, hash, _configMock.Object);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void F006_09_SecretKeyNull_ThrowsInvalidOperationException()
    {
        // Arrange
        var config = CreateConfigWithSecret(null);
        const string hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        // Act
        var act = () => HashingUtil.VerifyHash("password", hash, config.Object);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("HASHING_SECRET_KEY is not configured");
    }

    #endregion
}
