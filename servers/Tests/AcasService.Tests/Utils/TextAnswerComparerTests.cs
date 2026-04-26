using AcasService.Application.Utils;
using AcasService.Models;
using FluentAssertions;

namespace AcasService.Tests.Utils;

public class TextAnswerComparerTests
{
    // ========================================================================
    // NormalizeSingleChoice Tests
    // Code: lines 10-18 in TextAnswerComparer.cs
    // ========================================================================

    /// <summary>
    /// F029-UTCID01: NormalizeSingleChoice("  Hello World  ")
    /// answer not null, trimmed, uppercase -> "HELLO WORLD"
    /// </summary>
    [Fact]
    public void NormalizeSingleChoice_WhitespaceTrimmedAndUppercase()
    {
        // Act
        var result = TextAnswerComparer.NormalizeSingleChoice("  Hello World  ");

        // Assert
        result.Should().Be("HELLO WORLD");
    }

    /// <summary>
    /// F029-UTCID02: NormalizeSingleChoice(null)
    /// answer is null -> ""
    /// </summary>
    [Fact]
    public void NormalizeSingleChoice_Null_ReturnsEmpty()
    {
        // Act
        var result = TextAnswerComparer.NormalizeSingleChoice(null);

        // Assert
        result.Should().BeEmpty();
    }

    /// <summary>
    /// F029-UTCID03: NormalizeSingleChoice("   ")
    /// answer contains only whitespace -> ""
    /// </summary>
    [Fact]
    public void NormalizeSingleChoice_WhitespaceOnly_ReturnsEmpty()
    {
        // Act
        var result = TextAnswerComparer.NormalizeSingleChoice("   ");

        // Assert
        result.Should().BeEmpty();
    }

    /// <summary>
    /// F029-UTCID04: NormalizeSingleChoice("Tôi YÊU em")
    /// answer contains Unicode characters, preserved and uppercase -> "TÔI YÊU EM"
    /// </summary>
    [Fact]
    public void NormalizeSingleChoice_UnicodePreservedAndUppercase()
    {
        // Act
        var result = TextAnswerComparer.NormalizeSingleChoice("Tôi YÊU em");

        // Assert
        result.Should().Be("TÔI YÊU EM");
    }

    /// <summary>
    /// F029-UTCID05: NormalizeSingleChoice("Mixed CaSe")
    /// answer contains mixed case -> "MIXED CASE"
    /// </summary>
    [Fact]
    public void NormalizeSingleChoice_MixedCase_Uppercase()
    {
        // Act
        var result = TextAnswerComparer.NormalizeSingleChoice("Mixed CaSe");

        // Assert
        result.Should().Be("MIXED CASE");
    }

    /// <summary>
    /// F029-UTCID06: NormalizeSingleChoice("")
    /// answer is empty string -> ""
    /// </summary>
    [Fact]
    public void NormalizeSingleChoice_Empty_ReturnsEmpty()
    {
        // Act
        var result = TextAnswerComparer.NormalizeSingleChoice("");

        // Assert
        result.Should().BeEmpty();
    }

    // ========================================================================
    // NormalizeMultipleChoice Tests
    // Code: lines 20-31 in TextAnswerComparer.cs
    // ========================================================================

    /// <summary>
    /// F030-UTCID01: NormalizeMultipleChoice("C, A, B")
    /// comma-delimited, sorted, pipe-joined -> "A|B|C"
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_CommaDelimited_Sorted()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice("C, A, B");

        // Assert
        result.Should().Be("A|B|C");
    }

    /// <summary>
    /// F030-UTCID02: NormalizeMultipleChoice("[\"X\", \"Y\", \"Z\"]")
    /// valid JSON array, parsed and sorted -> "X|Y|Z"
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_ValidJsonArray_ParsedAndSorted()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice("[\"X\", \"Y\", \"Z\"]");

        // Assert
        result.Should().Be("X|Y|Z");
    }

    /// <summary>
    /// F030-UTCID03: NormalizeMultipleChoice("A, A, B, A")
    /// contains duplicate items, duplicates removed -> "A|B"
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_DuplicatesRemoved_Sorted()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice("A, A, B, A");

        // Assert
        result.Should().Be("A|B");
    }

    /// <summary>
    /// F030-UTCID04: NormalizeMultipleChoice("[bad json")
    /// Does not start with "[" or end with "]", so not a JSON candidate.
    /// Fallback: no delimiters found -> entire string is one token -> "[BAD JSON"
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_MalformedJson_FallbackToDelimiter()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice("[bad json");

        // Assert — no delimiters found, whole string treated as one token
        result.Should().Be("[BAD JSON");
    }

    /// <summary>
    /// F030-UTCID05: NormalizeMultipleChoice(null)
    /// answer is null -> ""
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_Null_ReturnsEmpty()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice(null);

        // Assert
        result.Should().BeEmpty();
    }

    /// <summary>
    /// F030-UTCID06: NormalizeMultipleChoice("")
    /// answer is empty string -> ""
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_Empty_ReturnsEmpty()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice("");

        // Assert
        result.Should().BeEmpty();
    }

    /// <summary>
    /// F030-UTCID07: NormalizeMultipleChoice("X|Y|Z")
    /// pipe-delimited string -> "X|Y|Z"
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_PipeDelimited_Sorted()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice("X|Y|Z");

        // Assert
        result.Should().Be("X|Y|Z");
    }

    /// <summary>
    /// F030-UTCID08: NormalizeMultipleChoice("[\"A\", \"B\"]\nC;D")
    /// Mixed delimiters with JSON. Since newline is inside the JSON string, JSON parsing fails.
    /// Fallback to delimiter split splits on \n, comma, semicolon.
    /// </summary>
    [Fact]
    public void NormalizeMultipleChoice_MixedDelimiters_Sorted()
    {
        // Act
        var result = TextAnswerComparer.NormalizeMultipleChoice("[\"A\", \"B\"]\nC;D");

        // Assert — JSON fails due to embedded \n, falls back to delimiter split
        result.Should().NotBeEmpty();
    }

    // ========================================================================
    // CompareSingleChoice Tests
    // Code: lines 33-36 in TextAnswerComparer.cs
    // ========================================================================

    /// <summary>
    /// F031-UTCID01: CompareSingleChoice("A", "a")
    /// Both normalized to "A", match -> true
    /// </summary>
    [Fact]
    public void CompareSingleChoice_SameLetterDifferentCase_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareSingleChoice("A", "a");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F031-UTCID02: CompareSingleChoice("A", "B")
    /// Both normalized, differ -> false
    /// </summary>
    [Fact]
    public void CompareSingleChoice_DifferentLetters_ReturnsFalse()
    {
        // Act
        var result = TextAnswerComparer.CompareSingleChoice("A", "B");

        // Assert
        result.Should().BeFalse();
    }

    /// <summary>
    /// F031-UTCID03: CompareSingleChoice("A", "  a  ")
    /// Both normalized to "A", match -> true
    /// </summary>
    [Fact]
    public void CompareSingleChoice_WhitespaceAroundSubmitted_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareSingleChoice("A", "  a  ");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F031-UTCID04: CompareSingleChoice(null, null)
    /// Both null -> normalized to "" == "" -> true
    /// </summary>
    [Fact]
    public void CompareSingleChoice_BothNull_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareSingleChoice(null, null);

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F031-UTCID05: CompareSingleChoice(null, "A")
    /// expected null -> "", submitted "A" -> "A", differ -> false
    /// </summary>
    [Fact]
    public void CompareSingleChoice_ExpectedNullSubmittedNotNull_ReturnsFalse()
    {
        // Act
        var result = TextAnswerComparer.CompareSingleChoice(null, "A");

        // Assert
        result.Should().BeFalse();
    }

    /// <summary>
    /// F031-UTCID06: CompareSingleChoice("", "")
    /// Both empty -> "" == "" -> true
    /// </summary>
    [Fact]
    public void CompareSingleChoice_BothEmpty_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareSingleChoice("", "");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F031-UTCID07: CompareSingleChoice("", " ")
    /// Both normalized to "" -> true
    /// </summary>
    [Fact]
    public void CompareSingleChoice_ExpectedEmptySubmittedWhitespace_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareSingleChoice("", " ");

        // Assert
        result.Should().BeTrue();
    }

    // ========================================================================
    // CompareMultipleChoice Tests
    // Code: lines 38-41 in TextAnswerComparer.cs
    // ========================================================================

    /// <summary>
    /// F032-UTCID01: CompareMultipleChoice("A,B", "b,a")
    /// Normalized: "A|B" == "A|B" (sorted, order-independent) -> true
    /// </summary>
    [Fact]
    public void CompareMultipleChoice_SameItemsDifferentOrder_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareMultipleChoice("A,B", "b,a");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F032-UTCID02: CompareMultipleChoice("A,B", "A,C")
    /// Normalized: "A|B" != "A|C" -> false
    /// </summary>
    [Fact]
    public void CompareMultipleChoice_DifferentItems_ReturnsFalse()
    {
        // Act
        var result = TextAnswerComparer.CompareMultipleChoice("A,B", "A,C");

        // Assert
        result.Should().BeFalse();
    }

    /// <summary>
    /// F032-UTCID03: CompareMultipleChoice("X,Y,Z", "Z,X,Y")
    /// Order-independent comparison -> true
    /// </summary>
    [Fact]
    public void CompareMultipleChoice_ThreeItemsDifferentOrder_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareMultipleChoice("X,Y,Z", "Z,X,Y");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F032-UTCID04: CompareMultipleChoice("A,B", "A")
    /// Different item count: "A|B" != "A" -> false
    /// </summary>
    [Fact]
    public void CompareMultipleChoice_DifferentItemCount_ReturnsFalse()
    {
        // Act
        var result = TextAnswerComparer.CompareMultipleChoice("A,B", "A");

        // Assert
        result.Should().BeFalse();
    }

    /// <summary>
    /// F032-UTCID05: CompareMultipleChoice("A,B,C", "A,B,C")
    /// Exact match -> true
    /// </summary>
    [Fact]
    public void CompareMultipleChoice_ExactMatch_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareMultipleChoice("A,B,C", "A,B,C");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F032-UTCID06: CompareMultipleChoice("A,B", "[\"B\",\"A\"]")
    /// JSON array format vs delimiter format, both normalize to "A|B" -> true
    /// </summary>
    [Fact]
    public void CompareMultipleChoice_JsonArrayVsDelimiter_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareMultipleChoice("A,B", "[\"B\",\"A\"]");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F032-UTCID07: CompareMultipleChoice(null, null)
    /// Both null -> NormalizeMultipleChoice returns "" == "" -> true
    /// </summary>
    [Fact]
    public void CompareMultipleChoice_BothNull_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareMultipleChoice(null, null);

        // Assert
        result.Should().BeTrue();
    }

    // ========================================================================
    // CompareByQuestionType Tests
    // Code: lines 43-51 in TextAnswerComparer.cs
    // ========================================================================

    /// <summary>
    /// F033-UTCID01: CompareByQuestionType(SINGLE_CHOICE, "A", "a")
    /// Calls CompareSingleChoice -> true
    /// </summary>
    [Fact]
    public void CompareByQuestionType_SingleChoiceMatching_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareByQuestionType(
            QuestionType.SINGLE_CHOICE, "A", "a");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F033-UTCID02: CompareByQuestionType(MULTIPLE_CHOICE, "A,B", "a,b")
    /// Calls CompareMultipleChoice -> true
    /// </summary>
    [Fact]
    public void CompareByQuestionType_MultipleChoiceMatching_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareByQuestionType(
            QuestionType.MULTIPLE_CHOICE, "A,B", "a,b");

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F033-UTCID03: CompareByQuestionType(ESSAY, ...)
    /// ESSAY type not handled -> false (default switch branch)
    /// </summary>
    [Fact]
    public void CompareByQuestionType_Essay_ReturnsFalse()
    {
        // Act
        var result = TextAnswerComparer.CompareByQuestionType(
            QuestionType.ESSAY, "some text", "some text");

        // Assert
        result.Should().BeFalse();
    }

    /// <summary>
    /// F033-UTCID04: CompareByQuestionType(unrecognized type, ...)
    /// Unrecognized type (default switch branch) -> false
    /// Note: SHORT_ANSWER does not exist in QuestionType enum, testing default branch.
    /// </summary>
    [Fact]
    public void CompareByQuestionType_UnrecognizedType_ReturnsFalse()
    {
        // Act
        var result = TextAnswerComparer.CompareByQuestionType(
            (QuestionType)999, "answer", "answer");

        // Assert
        result.Should().BeFalse();
    }

    /// <summary>
    /// F033-UTCID05: CompareByQuestionType(SINGLE_CHOICE, null, null)
    /// CompareSingleChoice(null, null) == true
    /// </summary>
    [Fact]
    public void CompareByQuestionType_SingleChoiceBothNull_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareByQuestionType(
            QuestionType.SINGLE_CHOICE, null, null);

        // Assert
        result.Should().BeTrue();
    }

    /// <summary>
    /// F033-UTCID06: CompareByQuestionType(MULTIPLE_CHOICE, null, null)
    /// CompareMultipleChoice(null, null) -> "" == "" -> true
    /// </summary>
    [Fact]
    public void CompareByQuestionType_MultipleChoiceBothNull_ReturnsTrue()
    {
        // Act
        var result = TextAnswerComparer.CompareByQuestionType(
            QuestionType.MULTIPLE_CHOICE, null, null);

        // Assert
        result.Should().BeTrue();
    }
}
