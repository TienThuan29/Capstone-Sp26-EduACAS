using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Web.Requests;

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

public class SubmissionMapper
{
    public Submission ToEntity(SubmitProblemRequest request)
    {
        var now = DateTime.UtcNow;
        return new Submission
        {
            Id = string.Empty,
            StudentId = request.StudentId,
            ExamId = request.ExamId,
            ProblemId = request.ProblemId,
            LanguageId = request.LanguageId,
            CompilerId = request.CompilerId,
            Source = request.Source,
            Version = 0,
            SubmittedDate = now,
            FinalScore = 0f,
            Status = SubmissionStatus.PENDING,
            GradedDate = default,
            TestResults = new List<TestResult>(),
            RegradingRequestId = string.Empty,
            LecturerFeedback = string.Empty,
            AiFeedback = string.Empty,
            UpdatedDate = now
        };
    }

    public SubmissionResponse ToResponse(Submission submission)
    {
        return new SubmissionResponse
        {
            Id = submission.Id,
            StudentId = submission.StudentId,
            ExamId = submission.ExamId,
            ProblemId = submission.ProblemId,
            Version = submission.Version,
            Status = submission.Status.ToString(),
            SubmittedDate = submission.SubmittedDate,
            FinalScore = submission.FinalScore
        };
    }

    /// <summary>
    /// Maps submission to response with optional problem info for UI display.
    /// </summary>
    public SubmissionResponse ToResponse(Submission submission, ProblemLiteResponse? problem)
    {
        var response = ToResponse(submission);
        response.Problem = problem;
        return response;
    }
}