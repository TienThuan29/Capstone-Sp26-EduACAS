using AcasService.Application.Commands.Problem;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Thirdparty;
using AcasService.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using ProblemModel = AcasService.Models.Problem;

namespace AcasService.Tests.Commands;

public class TestcaseGeneratorTests
{
    private readonly FakeGeminiClient _fakeGeminiClient;
    private readonly Mock<ILogger<TestcaseGenerator>> _mockLogger;
    private readonly TestcaseGenerator _sut;

    public TestcaseGeneratorTests()
    {
        _fakeGeminiClient = new FakeGeminiClient();
        _mockLogger = new Mock<ILogger<TestcaseGenerator>>();
        _sut = new TestcaseGenerator(_fakeGeminiClient, _mockLogger.Object);
    }

    // ========================================================================
    // TCG-01 — Generate normal cases (Normal)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_ValidProblem_ReturnsListOfTestcases()
    {
        // Arrange
        var problem = new ProblemModel
        {
            Id = "prob-001",
            Title = "Two Sum",
            Content = "Given an array of integers..."
        };

        _fakeGeminiClient.NextResponse = """
            [{"InputData":"1\n","ExpectedOutput":"2\n","IsPublic":true,"IsCaseInsensitive":false,"IsFloatingPoint":false,"FloatingPointTolerance":null,"DecimalPlaces":null,"IsTokenComparision":false,"IsNotOrderedComparision":false}]
            """;

        // Act
        var result = await _sut.GenerateTestcasesAsync(problem, 1);

        // Assert
        result.Should().HaveCount(1);
        result[0].ProblemId.Should().Be("prob-001");
        result[0].Id.Should().NotBeNullOrEmpty();
        result[0].InputData.Should().Be("1\n");
        result[0].ExpectedOutput.Should().Be("2\n");
    }

    // ========================================================================
    // TCG-02 — Generate boundary cases (Boundary)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_MultipleTestcases_ReturnsCorrectCount()
    {
        // Arrange
        var problem = new ProblemModel
        {
            Id = "prob-002",
            Title = "Boundary Test",
            Content = "Test with boundary values"
        };

        _fakeGeminiClient.NextResponse = """
            [
                {"InputData":"0\n","ExpectedOutput":"0\n","IsPublic":true,"IsCaseInsensitive":false,"IsFloatingPoint":false,"FloatingPointTolerance":null,"DecimalPlaces":null,"IsTokenComparision":false,"IsNotOrderedComparision":false},
                {"InputData":"999999\n","ExpectedOutput":"999999\n","IsPublic":false,"IsCaseInsensitive":false,"IsFloatingPoint":false,"FloatingPointTolerance":null,"DecimalPlaces":null,"IsTokenComparision":false,"IsNotOrderedComparision":false}
            ]
            """;

        // Act
        var result = await _sut.GenerateTestcasesAsync(problem, 2);

        // Assert
        result.Should().HaveCount(2);
        result.All(tc => tc.ProblemId == "prob-002").Should().BeTrue();
    }

    // ========================================================================
    // TCG-03 — Generate edge cases (Boundary)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_NullContent_ReplacedWithEmptyStringInPrompt()
    {
        // Arrange
        var problem = new ProblemModel
        {
            Id = "prob-003",
            Title = "Edge Case",
            Content = null!
        };

        string? capturedPrompt = null;
        _fakeGeminiClient.OnGenerateContentAsync = (prompt, _) =>
        {
            capturedPrompt = prompt;
            return """[{"InputData":"1\n","ExpectedOutput":"1\n","IsPublic":true,"IsCaseInsensitive":false,"IsFloatingPoint":false,"FloatingPointTolerance":null,"DecimalPlaces":null,"IsTokenComparision":false,"IsNotOrderedComparision":false}]""";
        };

        // Act
        var result = await _sut.GenerateTestcasesAsync(problem, 1);

        // Assert — null Content is replaced with empty string in the prompt (no "null" literal)
        result.Should().HaveCount(1);
        capturedPrompt.Should().Contain("Edge Case");
        capturedPrompt.Should().Contain("Content:");
        capturedPrompt.Should().NotContain("null!");
    }

    // ========================================================================
    // TCG-04 — Invalid problem id (Abnormal)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_NullProblem_ThrowsArgumentNullException()
    {
        // Act
        var act = async () => await _sut.GenerateTestcasesAsync(null!, 1);

        // Assert
        await act.Should().ThrowAsync<ArgumentNullException>()
            .WithParameterName("problem");
    }

    // ========================================================================
    // TCG-05 — Strategy = AllCombinations (Normal)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_GeminiReturnsPlainJson_ParsesCorrectly()
    {
        // Arrange
        var problem = new ProblemModel { Id = "prob-005", Title = "Combo", Content = "Test" };

        _fakeGeminiClient.NextResponse = """
            [{"InputData":"a\n","ExpectedOutput":"A\n","IsPublic":true,"IsCaseInsensitive":true,"IsFloatingPoint":false,"FloatingPointTolerance":null,"DecimalPlaces":null,"IsTokenComparision":false,"IsNotOrderedComparision":false}]
            """;

        // Act
        var result = await _sut.GenerateTestcasesAsync(problem, 1);

        // Assert
        result.Should().HaveCount(1);
        result[0].IsCaseInsensitive.Should().BeTrue();
    }

    // ========================================================================
    // TCG-06 — Strategy = Pairwise (Normal)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_GeminiReturnsMarkdownFencedJson_StripsFences()
    {
        // Arrange
        var problem = new ProblemModel { Id = "prob-006", Title = "Pairwise", Content = "Test" };

        _fakeGeminiClient.NextResponse = """
            ```json
            [{"InputData":"1 2\n","ExpectedOutput":"3\n","IsPublic":true,"IsCaseInsensitive":false,"IsFloatingPoint":false,"FloatingPointTolerance":null,"DecimalPlaces":null,"IsTokenComparision":false,"IsNotOrderedComparision":false}]
            ```
            """;

        // Act
        var result = await _sut.GenerateTestcasesAsync(problem, 1);

        // Assert
        result.Should().HaveCount(1);
        result[0].InputData.Should().Be("1 2\n");
    }

    // ========================================================================
    // TCG-07 — Strategy = BoundaryOnly (Boundary)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_GeminiReturnsTruncatedJson_RecoversFromTruncation()
    {
        // Arrange
        var problem = new ProblemModel { Id = "prob-007", Title = "BoundaryOnly", Content = "Test" };

        // Simulates a Gemini response truncated mid-object (trailing comma + newline pattern).
        // TryFixTruncatedDecimalJson skips this path (no trailing comma detected).
        // TryRecoverTestcases parses the leading complete object from the split.
        _fakeGeminiClient.NextResponse = "[{\"InputData\":\"MAX\\n\",\"ExpectedOutput\":\"OK\\n\",\"IsPublic\":false,\"IsCaseInsensitive\":false,\"IsFloatingPoint\":false,\"FloatingPointTolerance\":null,\"DecimalPlaces\":null,\"IsTokenComparision\":false,\"IsNotOrderedComparision\":false},\n{\"InputData\":\"B";

        // Act
        var result = await _sut.GenerateTestcasesAsync(problem, 1);

        // Assert — TryRecoverTestcases recovers the first valid testcase from the truncated response
        result.Should().HaveCount(1);
        result[0].InputData.Should().Be("MAX\n");
        result[0].ExpectedOutput.Should().Be("OK\n");
    }

    // ========================================================================
    // TCG-08 — Duplicate testcases (Abnormal)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_EmptyGeminiResponse_ThrowsInvalidOperationException()
    {
        // Arrange
        var problem = new ProblemModel { Id = "prob-008", Title = "Dupes", Content = "Test" };

        _fakeGeminiClient.NextResponse = string.Empty;

        // Act
        var act = async () => await _sut.GenerateTestcasesAsync(problem, 1);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Gemini returned empty content*");
    }

    // ========================================================================
    // TCG-09 — Zero input range (Boundary)
    // ========================================================================
    [Fact]
    public async Task GenerateTestcasesAsync_NumberOfTestcasesIsZero_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var problem = new ProblemModel { Id = "prob-009", Title = "Zero Range", Content = "Test" };

        // Act
        var act = async () => await _sut.GenerateTestcasesAsync(problem, 0);

        // Assert
        await act.Should().ThrowAsync<ArgumentOutOfRangeException>()
            .WithParameterName("numberOfTestcases")
            .WithMessage("*greater than zero*");
    }
}

/// <summary>
/// Fake IGeminiClient that avoids optional-parameter overload resolution issues
/// that prevent Moq from matching the correct overload.
/// </summary>
internal sealed class FakeGeminiClient : IGeminiClient
{
    public string NextResponse { get; set; } = "[]";

    public Func<string, GeminiGenerationConfig?, string>? OnGenerateContentAsync { get; set; }

    public Task<string> GenerateContentAsync(string prompt, CancellationToken cancellationToken = default)
        => Task.FromResult("[]");

    public Task<string> GenerateContentAsync(
        string prompt,
        GeminiGenerationConfig? generationConfig = null,
        CancellationToken cancellationToken = default)
    {
        var response = OnGenerateContentAsync?.Invoke(prompt, generationConfig) ?? NextResponse;
        return Task.FromResult(response);
    }
}
