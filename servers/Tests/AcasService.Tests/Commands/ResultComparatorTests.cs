using AcasService.Application.Commands.Submission;
using AcasService.Models;
using FluentAssertions;

namespace AcasService.Tests.Commands;

public class ResultComparatorTests
{
    private readonly ResultComparator _sut;

    public ResultComparatorTests()
    {
        _sut = new ResultComparator();
    }

    // ========================================================================
    // RC-01 — Exact match (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_ExactMatch_ReturnsSuccess()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("Hello World", "Hello World", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-02 — Exact mismatch (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_ExactMismatch_ReturnsFail()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("Hello World", "Hello world", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // RC-03 — Case insensitive match (Normal)
    // ========================================================================
    [Fact]
    public void Compare_CaseInsensitiveMatch_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsCaseInsensitive = true };
        var result = _sut.Compare("Hello World", "HELLO WORLD", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-04 — Case insensitive mismatch (Normal)
    // ========================================================================
    [Fact]
    public void Compare_CaseInsensitiveMismatch_ReturnsFail()
    {
        var option = new TestcaseOption { IsCaseInsensitive = true };
        var result = _sut.Compare("Hello World", "Goodbye World", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // RC-05 — Floating point within tolerance (Normal)
    // ========================================================================
    [Fact]
    public void Compare_FloatingPointWithinTolerance_ReturnsSuccess()
    {
        var option = new TestcaseOption
        {
            IsFloatingPoint = true,
            FloatingPointTolerance = 0.01
        };
        var result = _sut.Compare("3.14159", "3.142", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-06 — Floating point outside tolerance (Normal)
    // ========================================================================
    [Fact]
    public void Compare_FloatingPointOutsideTolerance_ReturnsFail()
    {
        var option = new TestcaseOption
        {
            IsFloatingPoint = true,
            FloatingPointTolerance = 0.01
        };
        // diff = 3.16 - 3.14159 = 0.01841 > 0.01 tolerance
        var result = _sut.Compare("3.14159", "3.16", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // RC-07 — Floating point exact (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_FloatingPointExact_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsFloatingPoint = true };
        var result = _sut.Compare("3.1415926535", "3.1415926535", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-08 — Token comparison exact (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_TokenComparisonExact_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("foo bar baz", "foo bar baz", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-09 — Token comparison different order (Normal)
    // ========================================================================
    [Fact]
    public void Compare_TokenComparisonDifferentOrder_ReturnsFail()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("foo bar baz", "bar foo baz", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // RC-10 — Token comparison extra token (Normal)
    // ========================================================================
    [Fact]
    public void Compare_TokenComparisonExtraToken_ReturnsFail()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("foo bar baz", "foo bar baz qux", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // RC-11 — Unordered comparison exact (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_UnorderedComparisonExact_ReturnsSuccess()
    {
        var option = new TestcaseOption
        {
            IsTokenComparision = true,
            IsNotOrderedComparision = true
        };
        var result = _sut.Compare("foo bar baz", "bar baz foo", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-12 — Unordered comparison missing token (Abnormal)
    // ========================================================================
    [Fact]
    public void Compare_UnorderedComparisonMissingToken_ReturnsFail()
    {
        var option = new TestcaseOption
        {
            IsTokenComparision = true,
            IsNotOrderedComparision = true
        };
        var result = _sut.Compare("foo bar baz", "bar foo", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // RC-13 — Empty expected, empty actual (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_EmptyExpectedEmptyActual_ReturnsSuccess()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("", "", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-14 — Empty expected, non-empty actual (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_EmptyExpectedNonEmptyActual_ReturnsFail()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("", "something", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // RC-15 — Whitespace handling (Boundary)
    // ========================================================================
    [Fact]
    public void Compare_WhitespaceHandling_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("  Hello   World  ", "Hello World", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // RC-16 — Null expected (Abnormal)
    // ========================================================================
    [Fact]
    public void Compare_NullExpected_ThrowsNullReferenceException()
    {
        var option = new TestcaseOption();
        var act = () => _sut.Compare(null!, "Hello World", option);
        act.Should().Throw<NullReferenceException>();
    }

    // ========================================================================
    // RC-17 — Null actual (Abnormal)
    // ========================================================================
    [Fact]
    public void Compare_NullActual_ThrowsNullReferenceException()
    {
        var option = new TestcaseOption();
        var act = () => _sut.Compare("Hello World", null!, option);
        act.Should().Throw<NullReferenceException>();
    }
}
