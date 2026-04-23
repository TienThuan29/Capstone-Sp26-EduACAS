using FluentAssertions;
using AuthService.Application.Utils;

namespace AcasService.Tests.AuthServiceTests;

public class OptGeneratorTests
{
    [Fact]
    public void GenerateOpt_NoArgument_ReturnsLength6()
    {
        // Act
        var result = OptGenerator.GenerateOpt();

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().Be(6);
    }

    [Fact]
    public void GenerateOpt_Length4_ReturnsLength4()
    {
        // Act
        var result = OptGenerator.GenerateOpt(4);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().Be(4);
    }

    [Fact]
    public void GenerateOpt_Length10_ReturnsLength10()
    {
        // Act
        var result = OptGenerator.GenerateOpt(10);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().Be(10);
    }

    [Fact]
    public void GenerateOpt_Length1_ReturnsLength1()
    {
        // Act
        var result = OptGenerator.GenerateOpt(1);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().Be(1);
    }

    [Fact]
    public void GenerateOpt_Length0_ReturnsEmptyString()
    {
        // Act
        var result = OptGenerator.GenerateOpt(0);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().Be(0);
        result.Should().BeEmpty();
    }

    [Fact]
    public void GenerateOpt_Length100_ReturnsLength100()
    {
        // Act
        var result = OptGenerator.GenerateOpt(100);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().Be(100);
    }

    [Fact]
    public void GenerateOpt_DefaultLength6_AllCharactersAreDigits()
    {
        // Act
        var result = OptGenerator.GenerateOpt();

        // Assert
        result.Should().MatchRegex("^[0-9]+$");
        result.Should().MatchRegex("^[0-9]{6}$");
        result.All(c => char.IsDigit(c)).Should().BeTrue();
    }

    [Fact]
    public void GenerateOpt_DefaultLength6_100Calls_ReturnsAtLeast90DistinctOtps()
    {
        // Arrange
        var otps = new HashSet<string>();

        // Act
        for (int i = 0; i < 100; i++)
        {
            otps.Add(OptGenerator.GenerateOpt());
        }

        // Assert - Due to randomness, we expect at least 90 distinct OTPs
        otps.Count.Should().BeGreaterOrEqualTo(90);
    }

    [Fact]
    public void GenerateOpt_Length20_AllDigitsAndCorrectLength()
    {
        // Act
        var result = OptGenerator.GenerateOpt(20);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().Be(20);
        result.Should().MatchRegex("^[0-9]+$");
        result.Should().MatchRegex("^[0-9]{20}$");
        result.All(c => char.IsDigit(c)).Should().BeTrue();
    }
}
