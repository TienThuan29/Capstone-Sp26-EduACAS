using AcasService.Models;

namespace AcasService.Application.Mappers;

public class TestResultMapper
{
      public TestResultResponse ToTestResultResponse(TestResult testResult)
      {
            return new TestResultResponse
            {
                  Id = Guid.NewGuid().ToString(),
                  TestcaseId = testResult.TestcaseId,
                  Input = testResult.Input,
                  ActualOutput = testResult.ActualOutput,
                  ExpectedOutput = testResult.ExpectedOutput,
                  ExecutionTimeMs = testResult.ExecutionTimeMs,
                  Status = testResult.Status.ToString(),
                  CreatedDate = testResult.CreatedDate
            };
      }
}