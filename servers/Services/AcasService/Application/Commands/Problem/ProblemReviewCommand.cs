using System.Text.Json;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Thirdparty;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Problem;

public interface IProblemReviewCommand
{
    Task<ProblemReviewResponse> ReviewProblemAsync(ProblemReviewRequest request, CancellationToken ct = default);
}

public sealed class ProblemReviewCommand : IProblemReviewCommand
{
    private readonly IGeminiClient _gemini;
    private readonly ILogger<ProblemReviewCommand> _logger;

    private const string SystemPrompt = """
        You are a programming exercise reviewer for the EduACAS system — a university-level programming learning platform.

        Task: Analyze and evaluate a programming exercise that a lecturer is preparing to add to the system.

        EduACAS system has the following STRICT CONSTRAINTS:
        1. **FUNCTIONAL** programming exercises are preferred (procedural/functional methods) — students code in a single file, no class definitions required.
        2. **Object-Oriented (OOP)** exercises must be strictly avoided — avoid problems requiring inheritance, polymorphism, interfaces, abstract classes, or design patterns.
        3. **Continuous interaction** exercises (e.g., game loops, real-time, continuous keyboard input) should be limited as the automated grading system cannot handle them well.
        4. Exercises requiring **complex external libraries/dependencies** (GUI, web frameworks, databases) should be limited.
        5. **Complex graph algorithms (DFS/BFS)** should be limited unless students have already covered the topic — ensure alignment with course objectives.
        6. **Full application writing** exercises (e.g., banking apps, student management systems...) should be limited in favor of concise algorithmic exercises.
        7. Exercises with **clear input/output and simple test cases** are preferred for automated grading.
        8. Exercises should have **appropriate difficulty** matching the assigned EASY/MEDIUM/HARD label.

        Required output: Return JSON with the following exact structure (DO NOT add any extra explanation, output JSON only):

        {
          "suitabilityLabel": "<SUITABLE | NEEDS_IMPROVEMENT | NOT_SUITABLE>",
          "summary": "<brief 1-2 sentence summary of the exercise suitability>",
          "recommendations": [
            {
              "type": "<CONTENT_STRUCTURE | DIFFICULTY | PROGRAMMING_PARADIGM | TESTABILITY | SCOPE>",
              "severity": "<INFO | WARNING | ERROR>",
              "description": "<description of the issue or suggestion>",
              "suggestedFix": "<specific guidance to improve>"
            }
          ],
          "concerns": ["<list of main concerns, each item is 1 sentence>"]
        }
        """;

    public ProblemReviewCommand(
        IGeminiClient gemini,
        ILogger<ProblemReviewCommand> logger)
    {
        _gemini = gemini;
        _logger = logger;
    }

    public async Task<ProblemReviewResponse> ReviewProblemAsync(ProblemReviewRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Starting problem review for Title={Title}", request.Title);

        bool hasFile = !string.IsNullOrWhiteSpace(request.FileData) && !string.IsNullOrWhiteSpace(request.MimeType);
        bool hasContent = !string.IsNullOrWhiteSpace(request.Content);

        string raw;
        if (hasFile)
        {
            _logger.LogInformation("Sending file directly to Gemini. MimeType={MimeType}, FileDataLength={Length}",
                request.MimeType, request.FileData!.Length);

            raw = await _gemini.GenerateContentWithFileAsync(
                SystemPrompt,
                request.FileData,
                request.MimeType,
                new GeminiGenerationConfig { Temperature = 0.2, MaxOutputTokens = 4096 },
                ct);
        }
        else if (hasContent)
        {
            _logger.LogInformation("Sending text content to Gemini. ContentLength={Length}", request.Content!.Length);

            raw = await _gemini.GenerateContentAsync(
                $"{SystemPrompt}\n\n---\n\n{BuildUserPrompt(request.Title, request.Content)}",
                new GeminiGenerationConfig { Temperature = 0.2, MaxOutputTokens = 4096 },
                ct);
        }
        else
        {
            throw new ArgumentException("Either Content or FileData (with MimeType) must be provided for review.");
        }

        return ParseAndValidateResponse(raw);
    }

    private static string BuildUserPrompt(string title, string content)
        => $"""
            Exercise information to review:
            Title: {title}
            Exercise content:
            {content}
            Please analyze and return the review JSON.
            """;

    private ProblemReviewResponse ParseAndValidateResponse(string raw)
    {
        var cleaned = ExtractJson(raw);

        try
        {
            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;

            var label = root.TryGetProperty("suitabilityLabel", out var l) ? l.GetString() ?? "NEEDS_IMPROVEMENT" : "NEEDS_IMPROVEMENT";
            var summary = root.TryGetProperty("summary", out var sum) ? sum.GetString() ?? "" : "";
            var concerns = ParseStringArray(root, "concerns");
            var recs = ParseRecommendations(root);

            _logger.LogInformation(
                "Problem review completed. Label={Label}",
                label);

            return new ProblemReviewResponse
            {
                SuitabilityLabel = label,
                Summary = summary,
                Recommendations = recs,
                Concerns = concerns
            };
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse Gemini JSON response, returning fallback. Raw={Raw}", raw[..Math.Min(raw.Length, 500)]);
            return BuildFallbackResponse(raw);
        }
    }

    private static string ExtractJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start >= 0 && end > start)
            return text[start..(end + 1)];
        return text.Trim();
    }

    private static List<ProblemReviewRecommendation> ParseRecommendations(JsonElement root)
    {
        var recs = new List<ProblemReviewRecommendation>();
        if (!root.TryGetProperty("recommendations", out var recArr) || recArr.ValueKind != JsonValueKind.Array)
            return recs;

        foreach (var item in recArr.EnumerateArray())
        {
            recs.Add(new ProblemReviewRecommendation
            {
                Type = item.TryGetProperty("type", out var t) ? t.GetString() ?? "" : "",
                Severity = item.TryGetProperty("severity", out var sev) ? sev.GetString() ?? "INFO" : "INFO",
                Description = item.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "",
                SuggestedFix = item.TryGetProperty("suggestedFix", out var f) ? f.GetString() ?? "" : ""
            });
        }
        return recs;
    }

    private static List<string> ParseStringArray(JsonElement root, string propertyName)
    {
        var list = new List<string>();
        if (!root.TryGetProperty(propertyName, out var arr) || arr.ValueKind != JsonValueKind.Array)
            return list;

        foreach (var item in arr.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
                list.Add(item.GetString() ?? "");
        }
        return list;
    }

    private static ProblemReviewResponse BuildFallbackResponse(string rawResponse)
        => new()
        {
            SuitabilityLabel = "NEEDS_IMPROVEMENT",
            Summary = "AI response could not be fully parsed. Please review the response manually.",
            Concerns = new List<string>
            {
                "Failed to parse JSON response from Gemini. Returning fallback result.",
                $"Raw response (first 500 chars): {rawResponse[..Math.Min(rawResponse.Length, 500)]}"
            },
            Recommendations = new List<ProblemReviewRecommendation>()
        };
}
