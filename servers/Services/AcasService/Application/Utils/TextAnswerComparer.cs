using System.Text.Json;
using AcasService.Models;

namespace AcasService.Application.Utils;

public static class TextAnswerComparer
{
    private static readonly char[] MultiChoiceDelimiters = [',', ';', '|', '\n', '\r'];

    public static string NormalizeSingleChoice(string? answer)
    {
        if (string.IsNullOrWhiteSpace(answer))
        {
            return string.Empty;
        }

        return CollapseWhitespace(answer).ToUpperInvariant();
    }

    public static string NormalizeMultipleChoice(string? answer)
    {
        var tokens = ParseMultipleChoiceTokens(answer)
            .Select(CollapseWhitespace)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.ToUpperInvariant())
            .Distinct(StringComparer.Ordinal)
            .OrderBy(x => x, StringComparer.Ordinal)
            .ToList();

        return string.Join("|", tokens);
    }

    public static bool CompareSingleChoice(string? expectedAnswer, string? submittedAnswer)
    {
        return NormalizeSingleChoice(expectedAnswer) == NormalizeSingleChoice(submittedAnswer);
    }

    public static bool CompareMultipleChoice(string? expectedAnswer, string? submittedAnswer)
    {
        return NormalizeMultipleChoice(expectedAnswer) == NormalizeMultipleChoice(submittedAnswer);
    }

    public static bool CompareByQuestionType(QuestionType questionType, string? expectedAnswer, string? submittedAnswer)
    {
        return questionType switch
        {
            QuestionType.SINGLE_CHOICE => CompareSingleChoice(expectedAnswer, submittedAnswer),
            QuestionType.MULTIPLE_CHOICE => CompareMultipleChoice(expectedAnswer, submittedAnswer),
            _ => false
        };
    }

    private static IEnumerable<string> ParseMultipleChoiceTokens(string? rawAnswer)
    {
        if (string.IsNullOrWhiteSpace(rawAnswer))
        {
            return [];
        }

        var trimmed = rawAnswer.Trim();
        if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<string>>(trimmed);
                return parsed ?? [];
            }
            catch
            {
                // Fallback to delimiter split when JSON is malformed.
            }
        }

        return trimmed.Split(MultiChoiceDelimiters, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static string CollapseWhitespace(string value)
    {
        return string.Join(" ", value.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }
}
