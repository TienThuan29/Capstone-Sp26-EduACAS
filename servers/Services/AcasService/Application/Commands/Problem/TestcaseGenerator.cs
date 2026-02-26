using System.Globalization;
using System.Text.Json;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Thirdparty;
using ProblemModel = AcasService.Models.Problem;

namespace AcasService.Application.Commands.Problem;

public interface ITestcaseGenerator
{
    Task<List<TestCaseResponse>> GenerateTestcasesAsync(ProblemModel problem, int numberOfTestcases);
}


public class TestcaseGenerator : ITestcaseGenerator
{
      private readonly IGeminiClient _geminiClient;
      private readonly ILogger<TestcaseGenerator> _logger;

      public TestcaseGenerator(
          IGeminiClient geminiClient,
          ILogger<TestcaseGenerator> logger)
      {
            _geminiClient = geminiClient;
            _logger = logger;
      }

      public async Task<List<TestCaseResponse>> GenerateTestcasesAsync(ProblemModel problem, int numberOfTestcases)
      {
            if (problem is null)
            {
                  throw new ArgumentNullException(nameof(problem));
            }

            if (numberOfTestcases <= 0)
            {
                  throw new ArgumentOutOfRangeException(nameof(numberOfTestcases), "Number of testcases must be greater than zero.");
            }

            var problemId = problem.Id;

            // Build prompt from template
            var prompt = promptTemplate
                .Replace("{{NUMBER_OF_TESTCASES}}", numberOfTestcases.ToString(CultureInfo.InvariantCulture))
                .Replace("{{PROBLEM_TITLE}}", problem.Title ?? string.Empty)
                .Replace("{{PROBLEM_CONTENT}}", problem.Content ?? string.Empty);

            var generationConfig = new GeminiGenerationConfig
            {
                  Temperature = 0.4,
                  MaxOutputTokens = 2048
            };

            var raw = await _geminiClient.GenerateContentAsync(prompt, generationConfig);

            if (string.IsNullOrWhiteSpace(raw))
            {
                  throw new InvalidOperationException("Gemini returned empty content when generating testcases.");
            }

            var json = raw.Trim();

            // Defensive: strip markdown fences if the model still returns them
            if (json.StartsWith("```", StringComparison.Ordinal))
            {
                  var firstNewLine = json.IndexOf('\n');
                  if (firstNewLine >= 0)
                  {
                        json = json[(firstNewLine + 1)..];
                  }

                  var lastFence = json.LastIndexOf("```", StringComparison.Ordinal);
                  if (lastFence >= 0)
                  {
                        json = json[..lastFence];
                  }

                  json = json.Trim();
            }

            List<TestCaseResponse>? testcases = null;
            try
            {
                  testcases = JsonSerializer.Deserialize<List<TestCaseResponse>>(json, new JsonSerializerOptions
                  {
                        PropertyNameCaseInsensitive = true
                  });
            }
            catch (JsonException ex)
            {
                  _logger.LogWarning(ex,
                        "Primary JSON deserialization failed for Gemini testcase JSON for problem {ProblemId}. Attempting best-effort recovery. Raw response: {Response}",
                        problemId, json);

                  // First, special-case fix for truncation at \"Decimal...\" field
                  var fixedJson = TryFixTruncatedDecimalJson(json);
                  if (!string.IsNullOrWhiteSpace(fixedJson))
                  {
                        try
                        {
                              var fixedList = JsonSerializer.Deserialize<List<TestCaseResponse>>(fixedJson, new JsonSerializerOptions
                              {
                                    PropertyNameCaseInsensitive = true
                              });

                              if (fixedList != null && fixedList.Count > 0)
                              {
                                    _logger.LogInformation(
                                          "Recovered {Count} testcases from truncated Decimal* JSON for problem {ProblemId}",
                                          fixedList.Count,
                                          problemId);
                                    // Early return on successful recovery
                                    foreach (var tc in fixedList)
                                    {
                                          tc.Id = Guid.NewGuid().ToString();
                                          tc.ProblemId = problemId;
                                    }

                                    return fixedList;
                              }
                        }
                        catch
                        {
                              // ignore and fall through to generic recovery
                        }
                  }

                  // Generic best-effort recovery on a per-object basis
                  if (testcases == null)
                  {
                        var recovered = TryRecoverTestcases(json);
                        if (recovered.Count > 0)
                        {
                              _logger.LogInformation(
                                    "Recovered {Count} testcases from partially invalid JSON for problem {ProblemId}",
                                    recovered.Count,
                                    problemId);
                              foreach (var tc in recovered)
                              {
                                    tc.Id = Guid.NewGuid().ToString();
                                    tc.ProblemId = problemId;
                              }

                              return recovered;
                        }
                  }

                  _logger.LogError(ex,
                        "Failed to deserialize Gemini testcase JSON for problem {ProblemId} even after recovery attempt. Raw response: {Response}",
                        problemId,
                        json);
                  throw;
            }

            if (testcases == null || testcases.Count == 0)
            {
                  throw new InvalidOperationException("Gemini response could not be parsed into any testcases.");
            }

            foreach (var tc in testcases)
            {
                  tc.Id = Guid.NewGuid().ToString();
                  tc.ProblemId = problemId;
            }

            return testcases;
      }

      private static string? TryFixTruncatedDecimalJson(string json)
      {
            if (string.IsNullOrWhiteSpace(json))
            {
                  return null;
            }

            // We frequently see truncation right after a trailing comma on the last
            // valid property (e.g. \"FloatingPointTolerance\": null, \" ). To fix,
            // trim everything after the LAST comma-newline sequence and then close
            // the object/array.
            var commaNewlineIndex = json.LastIndexOf(",\n", StringComparison.Ordinal);
            if (commaNewlineIndex < 0)
            {
                  return null;
            }

            var prefix = json[..commaNewlineIndex].TrimEnd();

            // Ensure we still have the opening array bracket
            if (!prefix.StartsWith("[", StringComparison.Ordinal))
            {
                  prefix = "[" + prefix;
            }

            var sb = new System.Text.StringBuilder();
            sb.AppendLine(prefix);
            sb.AppendLine();
            sb.AppendLine("  }");
            sb.Append(']');

            return sb.ToString();
      }

      private static List<TestCaseResponse> TryRecoverTestcases(string json)
      {
            var result = new List<TestCaseResponse>();

            if (string.IsNullOrWhiteSpace(json))
            {
                  return result;
            }

            var inner = json.Trim();

            // Remove surrounding array brackets if present
            if (inner.StartsWith("[", StringComparison.Ordinal))
            {
                  inner = inner[1..];
            }

            if (inner.EndsWith("]", StringComparison.Ordinal))
            {
                  inner = inner[..^1];
            }

            var segments = inner.Split("},", StringSplitOptions.RemoveEmptyEntries);

            foreach (var segment in segments)
            {
                  var candidate = segment.Trim();

                  if (!candidate.StartsWith("{", StringComparison.Ordinal))
                  {
                        candidate = "{" + candidate;
                  }

                  if (!candidate.EndsWith("}", StringComparison.Ordinal))
                  {
                        candidate += "}";
                  }

                  try
                  {
                        var tc = JsonSerializer.Deserialize<TestCaseResponse>(candidate, new JsonSerializerOptions
                        {
                              PropertyNameCaseInsensitive = true
                        });

                        if (tc != null)
                        {
                              result.Add(tc);
                        }
                  }
                  catch
                  {
                        // Ignore segments that still cannot be parsed
                  }
            }

            return result;
      }

      public readonly string promptTemplate = """
You are an automated test case generator for an online programming judge.

GOAL
Given a programming problem and its I/O specification, generate exactly {{NUMBER_OF_TESTCASES}} high-quality and 100% coverage test cases that will be used to automatically grade student solutions.

PROBLEM
Title: {{PROBLEM_TITLE}}

Content: {{PROBLEM_CONTENT}}

TEST CASE OBJECT FORMAT

You must return a JSON array of test case objects.
Each object MUST have these fields (matching C# property names):

- "InputData": string
- "ExpectedOutput": string
- "IsPublic": bool
- "IsCaseInsensitive": bool
- "IsFloatingPoint": bool
- "FloatingPointTolerance": number or null
- "DecimalPlaces": integer or null
- "IsTokenComparision": bool
- "IsNotOrderedComparision": bool

Field rules:

- InputData:
  - Raw stdin exactly as the program will receive it, including newlines and spaces.
- ExpectedOutput:
  - Exact correct stdout for that input, including newlines and spaces.
- IsPublic:
  - true only for a small subset of simple, illustrative test cases that can be shown to users.
  - false for hidden / tricky / edge cases.
- IsCaseInsensitive:
  - true only if the problem explicitly says output comparison is case-insensitive.
  - Otherwise false.
- IsFloatingPoint:
  - true only if the expected output includes floating-point numbers that may have rounding/precision issues.
  - If true, set EITHER:
    - FloatingPointTolerance: absolute error tolerance (e.g. 1e-6), OR
    - DecimalPlaces: integer count of decimal places to compare.
  - The unused one should be null.
- IsTokenComparision:
  - true when output should be compared token-by-token (whitespace-separated), not as a raw string.
  - Typically true when output is a sequence/list/set of values.
- IsNotOrderedComparision:
  - true ONLY when the order of tokens does NOT matter (multiset comparison).
  - Otherwise false.

TEST CASE DESIGN REQUIREMENTS

- Cover:
  - Typical/common cases.
  - Edge and boundary cases (min/max values, empty structures, single-element cases, extremes).
  - Large but valid inputs within the constraints.
  - Tricky corner cases that can break naive solutions (overflow, duplicates, ties, etc.).
- Avoid duplicate or redundant testcases; each testcase should add unique coverage.
- Make sure all testcases strictly follow the given input and output formats.

OUTPUT FORMAT (CRITICAL)

- Respond with ONLY a valid JSON array (list) of test case objects.
- Do NOT include any surrounding text, explanation, or markdown.
- Do NOT wrap the JSON in ``` fences.
- Generate EXACTLY {{NUMBER_OF_TESTCASES}} objects.

Example of the required JSON shape (values are just illustrative):

[
  {
    "InputData": "3\n1 2 3\n",
    "ExpectedOutput": "6\n",
    "IsPublic": true,
    "IsCaseInsensitive": false,
    "IsFloatingPoint": false,
    "FloatingPointTolerance": null,
    "DecimalPlaces": null,
    "IsTokenComparision": false,
    "IsNotOrderedComparision": false
  }
]

Now generate the JSON array of {{NUMBER_OF_TESTCASES}} test cases using the problem above.
""";

      
}