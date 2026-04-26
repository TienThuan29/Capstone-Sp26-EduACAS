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
    // F028-UTCID01 Exact match
    // ========================================================================
    [Fact]
    public void ExactMatch_ReturnsSuccess()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("Hello World", "Hello World", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID02 Exact mismatch
    // ========================================================================
    [Fact]
    public void ExactMismatch_ReturnsFail()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("Hello World", "Hello world", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // F028-UTCID03 Case insensitive match
    // ========================================================================
    [Fact]
    public void CaseInsensitiveMatch_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsCaseInsensitive = true };
        var result = _sut.Compare("Hello World", "HELLO WORLD", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID04 Case insensitive mismatch
    // ========================================================================
    [Fact]
    public void CaseInsensitiveMismatch_ReturnsFail()
    {
        var option = new TestcaseOption { IsCaseInsensitive = true };
        var result = _sut.Compare("Hello World", "HELLO WORLD!!!", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // F028-UTCID05 Floating point within tolerance
    // ========================================================================
    [Fact]
    public void FloatingPointWithinTolerance_ReturnsSuccess()
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
    // F028-UTCID06 Floating point outside tolerance
    // ========================================================================
    [Fact]
    public void FloatingPointOutsideTolerance_ReturnsFail()
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
    // F028-UTCID07 Floating point exact match
    // ========================================================================
    [Fact]
    public void FloatingPointExact_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsFloatingPoint = true };
        var result = _sut.Compare("3.1415926535", "3.1415926535", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID08 Token comparison exact match
    // ========================================================================
    [Fact]
    public void TokenComparisonExact_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("foo bar baz", "foo bar baz", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID09 Token comparison different order
    // ========================================================================
    [Fact]
    public void TokenComparisonDifferentOrder_ReturnsFail()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("foo bar baz", "bar foo baz", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // F028-UTCID10 Token comparison extra token
    // ========================================================================
    [Fact]
    public void TokenComparisonExtraToken_ReturnsFail()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("foo bar baz", "foo bar baz qux", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // F028-UTCID11 Unordered comparison exact
    // ========================================================================
    [Fact]
    public void UnorderedComparisonExact_ReturnsSuccess()
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
    // F028-UTCID12 Unordered comparison missing token
    // ========================================================================
    [Fact]
    public void UnorderedComparisonMissingToken_ReturnsFail()
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
    // F028-UTCID13 - Empty expected, empty actual
    // ========================================================================
    [Fact]
    public void EmptyExpectedEmptyActual_ReturnsSuccess()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("", "", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID14 - Empty expected, non-empty actual
    // ========================================================================
    [Fact]
    public void EmptyExpectedNonEmptyActual_ReturnsFail()
    {
        var option = new TestcaseOption();
        var result = _sut.Compare("", "something", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // F028-UTCID15 - Whitespace handling (trim)
    // ========================================================================
    [Fact]
    public void WhitespaceHandling_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("  Hello   World  ", "Hello World", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID16 - Null expected
    // ========================================================================
    [Fact]
    public void NullExpected_ThrowsNullReferenceException()
    {
        var option = new TestcaseOption();
        var act = () => _sut.Compare(null!, "Hello World", option);
        act.Should().Throw<NullReferenceException>();
    }

    // ========================================================================
    // F028-UTCID17 - Null actual
    // ========================================================================
    [Fact]
    public void NullActual_ThrowsNullReferenceException()
    {
        var option = new TestcaseOption();
        var act = () => _sut.Compare("Hello World", null!, option);
        act.Should().Throw<NullReferenceException>();
    }

    // ========================================================================
    // F028-UTCID18 - Decimal places (2 places)
    // ========================================================================
    [Fact]
    public void DecimalPlacesTwo_SameRoundedValue_ReturnsSuccess()
    {
        var option = new TestcaseOption
        {
            IsFloatingPoint = true,
            DecimalPlaces = 2
        };
        var result = _sut.Compare("3.14159", "3.14", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID19 - Comma as decimal separator
    // ========================================================================
    [Fact]
    public void CommaAsDecimalSeparator_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsFloatingPoint = true };
        var result = _sut.Compare("3,14159", "3.14159", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID20 - Floating point epsilon (no tolerance, no decimal places)
    // ========================================================================
    [Fact]
    public void FloatingPointEpsilon_SameValue_ReturnsSuccess()
    {
        var option = new TestcaseOption { IsFloatingPoint = true };
        var result = _sut.Compare("0.1", "0.1", option);
        result.Should().Be(TestcaseStatus.SUCCESS);
    }

    // ========================================================================
    // F028-UTCID21 - Token comparison different token count
    // ========================================================================
    [Fact]
    public void TokenComparisonDifferentTokenCount_ReturnsFail()
    {
        var option = new TestcaseOption { IsTokenComparision = true };
        var result = _sut.Compare("foo bar", "foo", option);
        result.Should().Be(TestcaseStatus.FAIL);
    }

    // ========================================================================
    // F028-UTCID22 - Null option
    // ========================================================================
    [Fact]
    public void NullOption_ThrowsNullReferenceException()
    {
        var act = () => _sut.Compare("Hello World", "Hello World", null!);
        act.Should().Throw<NullReferenceException>();
    }
}
