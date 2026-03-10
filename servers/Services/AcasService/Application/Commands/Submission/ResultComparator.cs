using System;
using System.Linq;
using System.Globalization;
using System.Text.RegularExpressions;
using AcasService.Models;

public interface IResultComparator
{
      public TestcaseStatus Compare(string expectedOutput, string output, TestcaseOption option);
}

public class ResultComparator : IResultComparator
{
      public TestcaseStatus Compare(string expectedOutput, string actualOutput, TestcaseOption option)
      {
            var (normExpected, normActual) = this.Normalize(expectedOutput, actualOutput, option);

            List<string> expectedTokens;
            List<string> actualTokens;

            if (option.IsTokenComparision)
            {
                  expectedTokens = this.Tokenize(normExpected);
                  actualTokens = this.Tokenize(normActual);
                  // Step 3: check length; if not equal, return FAIL
                  if (actualTokens.Count != expectedTokens.Count)
                  {
                        return TestcaseStatus.FAIL;
                  }
                  // Step 4: handle not ordered (sort both if needed)
                  (expectedTokens, actualTokens) = this.HandleNotOrdered(expectedTokens, actualTokens, option);
            }
            else
            {
                  // If not using token compare, treat entire string as single token
                  expectedTokens = new List<string> { normExpected };
                  actualTokens = new List<string> { normActual };
            }

            // Step 5: Compare Loop - compare corresponding pairs one-to-one
            for (int i = 0; i < expectedTokens.Count; i++)
            {
                  string expectedToken = expectedTokens[i];
                  string actualToken = actualTokens[i];

                  bool tokensMatch;
                  if (option.IsFloatingPoint)
                  {
                        // Floating point: check tolerance / decimal places
                        tokensMatch = CompareFloatingPoint(actualToken, expectedToken, option);
                  }
                  else
                  {
                        // String: exact equality (case already handled in Step 1)
                        tokensMatch = actualToken == expectedToken;
                  }

                  if (!tokensMatch)
                  {
                        return TestcaseStatus.FAIL;
                  }
            }
            return TestcaseStatus.SUCCESS;
      }

      private (string expected, string output) Normalize(
            string expectedOutput, string output, TestcaseOption option
      ) {
            // string expected = Regex.Replace(expectedOutput.Trim(), @"\s+", " ").Trim();
            // string outVal = Regex.Replace(output.Trim(), @"\s+", " ").Trim();
            // Trim: remove leading/trailing whitespace
            string expected = expectedOutput.Trim();
            string outVal = output.Trim();

            if (option.IsTokenComparision)
            {
                  // Collapse all whitespace sequences (spaces, newlines, tabs) to single space
                  expected = Regex.Replace(expected, @"\s+", " ");
                  outVal = Regex.Replace(outVal, @"\s+", " ");
            }

            // Locale: change comma to period when treating as real number
            if (option.IsFloatingPoint)
            {
                  expected = expected.Replace(',', '.');
                  outVal = outVal.Replace(',', '.');
            }

            // Case insensitive: convert to lowercase
            if (option.IsCaseInsensitive)
            {
                  expected = expected.ToLowerInvariant();
                  outVal = outVal.ToLowerInvariant();
            }

            return (expected, outVal);
      }

      private List<string> Tokenize(string input)
      {
            if (string.IsNullOrWhiteSpace(input))
            {
                  return new List<string>();
            }
            string[] tokens = Regex.Split(input.Trim(), @"\s+");
            // filter out empty tokens
            return tokens.Where(t => !string.IsNullOrEmpty(t)).ToList();
      }

      private (List<string> expectedTokens, List<string> actualTokens) HandleNotOrdered(
            List<string> expectedTokens,
            List<string> actualTokens,
            TestcaseOption option)
      {
            if (option.IsNotOrderedComparision == true)
            {
                  return (
                        expectedTokens.OrderBy(t => t).ToList(),
                        actualTokens.OrderBy(t => t).ToList()
                  );
            }
            return (expectedTokens, actualTokens);
      }


      private static bool CompareFloatingPoint(string actual, string expected, TestcaseOption option)
      {
            if (!double.TryParse(actual, NumberStyles.Float, CultureInfo.InvariantCulture, out double actualValue))
            {
                  return false; 
            }
            if (!double.TryParse(expected, NumberStyles.Float, CultureInfo.InvariantCulture, out double expectedValue))
            {
                  return false;
            }

            // Check tolerance if specified
            if (option.FloatingPointTolerance.HasValue)
            {
                  double diff = Math.Abs(actualValue - expectedValue);
                  if (diff > option.FloatingPointTolerance.Value)
                  {
                        return false; 
                  }
            }

            // Check decimal places if specified
            if (option.DecimalPlaces.HasValue)
            {
                  double roundedActual = Math.Round(actualValue, option.DecimalPlaces.Value);
                  double roundedExpected = Math.Round(expectedValue, option.DecimalPlaces.Value);
                  if (roundedActual != roundedExpected)
                  {
                        return false;
                  }
            }

            // If neither tolerance nor decimal places specified, use exact equality
            if (!option.FloatingPointTolerance.HasValue && !option.DecimalPlaces.HasValue)
            {
                  return actualValue == expectedValue;
            }

            return true; // Passed all checks
      }
}

public class TestcaseOption
{
      public bool IsCaseInsensitive { get; set; }

      public bool IsFloatingPoint { get; set; }

      public double? FloatingPointTolerance { get; set; } = null;

      public int? DecimalPlaces { get; set; }

      public bool IsTokenComparision { get; set; }

      public bool? IsNotOrderedComparision { get; set; }
}