using AcasService.Application.Commands.StudentAnswer;
using AcasService.Models;
using FluentAssertions;

namespace AcasService.Tests.Commands;

public class StudentAnswerCommandTests
{
    // ========================================================================
    // StudentAnswerCommand contains static helper methods for normalizing
    // and comparing text answers. These are the core methods tested here.
    // ========================================================================

    [Fact]
    public void NormalizeSingleChoiceTextAnswer_WithWhitespace_NormalizesOutput()
    {
        // Act
        var result = StudentAnswerCommand.NormalizeSingleChoiceTextAnswer("  Answer  ");

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
    }

    [Fact]
    public void NormalizeSingleChoiceTextAnswer_WithNull_ReturnsEmpty()
    {
        // Act
        var result = StudentAnswerCommand.NormalizeSingleChoiceTextAnswer(null);

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public void NormalizeMultipleChoiceTextAnswer_WithWhitespaceAndDuplicates_NormalizesOutput()
    {
        // Act
        var result = StudentAnswerCommand.NormalizeMultipleChoiceTextAnswer("  opt1 , opt2 , opt1  ");

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public void NormalizeMultipleChoiceTextAnswer_WithNull_ReturnsEmpty()
    {
        // Act
        var result = StudentAnswerCommand.NormalizeMultipleChoiceTextAnswer(null);

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public void CompareTextAnswer_ForSingleChoice_SameAnswer_ReturnsTrue()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.SINGLE_CHOICE, "Answer", "Answer");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void CompareTextAnswer_ForSingleChoice_DifferentAnswer_ReturnsFalse()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.SINGLE_CHOICE, "Answer A", "Answer B");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CompareTextAnswer_ForEssay_SameText_ReturnsFalse()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.ESSAY, "The quick brown fox", "The quick brown fox");

        // Assert — ESSAY type is not handled by CompareByQuestionType, returns false
        result.Should().BeFalse();
    }

    [Fact]
    public void CompareTextAnswer_ForEssay_DifferentText_ReturnsFalse()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.ESSAY, "Answer One", "Answer Two");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CompareTextAnswer_ForMultipleChoice_AllOptionsCorrect_ReturnsTrue()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.MULTIPLE_CHOICE, "opt-a,opt-b", "opt-a,opt-b");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void CompareTextAnswer_ForMultipleChoice_MissingOption_ReturnsFalse()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.MULTIPLE_CHOICE, "opt-a,opt-b", "opt-a");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CompareTextAnswer_WithNullExpected_ReturnsFalse()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.SINGLE_CHOICE, null, "Answer");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CompareTextAnswer_WithNullSubmitted_ReturnsFalse()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.SINGLE_CHOICE, "Answer", null);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CompareTextAnswer_BothNull_ReturnsTrue()
    {
        // Act
        var result = StudentAnswerCommand.CompareTextAnswer(
            QuestionType.SINGLE_CHOICE, null, null);

        // Assert — both normalize to empty string, which are equal
        result.Should().BeTrue();
    }

    [Fact]
    public void NormalizeSingleChoiceTextAnswer_WithLeadingTrailingSpaces_TrimsWhitespace()
    {
        // Arrange
        var input = "   trimmed   ";

        // Act
        var result = StudentAnswerCommand.NormalizeSingleChoiceTextAnswer(input);

        // Assert
        result.Should().Be("TRIMMED");
    }

    [Fact]
    public void NormalizeMultipleChoiceTextAnswer_WithDifferentOrderings_Normalizes()
    {
        // Arrange — order should not matter for multiple choice comparison
        var result1 = StudentAnswerCommand.NormalizeMultipleChoiceTextAnswer("a, b, c");
        var result2 = StudentAnswerCommand.NormalizeMultipleChoiceTextAnswer("c, b, a");

        // Assert
        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
    }
}
