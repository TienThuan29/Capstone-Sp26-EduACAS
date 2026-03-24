using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
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

      public TestResult ToEntity(TestResultResponse response)
      {
            Enum.TryParse<TestcaseStatus>(response.Status, out var status);
            return new TestResult
            {
                  Id = response.Id,
                  TestcaseId = response.TestcaseId,
                  Input = response.Input,
                  ActualOutput = response.ActualOutput,
                  ExpectedOutput = response.ExpectedOutput,
                  ExecutionTimeMs = response.ExecutionTimeMs,
                  Status = status,
                  CreatedDate = response.CreatedDate
            };
      }
}

public class KeystrokeMapper
{
    public KeystrokeLogResponse ToKeystrokeLogResponse(KeystrokeLog keystrokeLog)
    {
        return new KeystrokeLogResponse
        {
            Id = keystrokeLog.Id,
            SubmissionId = keystrokeLog.SubmissionId,
            KeystrokeData = keystrokeLog.KeystrokeData?
                .Select(ToKeystrokeRecordResponse)
                .ToList() ?? new List<KeystrokeRecordResponse>(),
            CreatedAt = keystrokeLog.CreatedAt
        };
    }

    public KeystrokeRecordResponse ToKeystrokeRecordResponse(KeystrokeRecord keystrokeRecord)
    {
        return new KeystrokeRecordResponse
        {
            TimeStartSet = keystrokeRecord.TimeStartSet,
            TimeOffSet = keystrokeRecord.TimeOffSet,
            Duration = keystrokeRecord.Duration,
            Cps = keystrokeRecord.Cps,
            CharCount = keystrokeRecord.CharCount,
            Content = keystrokeRecord.Content
        };
    }
}

public class SubmissionMapper
{
    private readonly TestResultMapper _testResultMapper = new();
    private readonly KeystrokeMapper _keystrokeMapper = new();

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
            GradedDate = null,
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
            LanguageId = submission.LanguageId,
            CompilerId = submission.CompilerId,
            Source = submission.Source,
            Version = submission.Version,
            Status = submission.Status.ToString(),
            SubmittedDate = submission.SubmittedDate,
            FinalScore = submission.FinalScore,
            GradedDate = submission.GradedDate,
            TestResults = submission.TestResults?
                .Select(_testResultMapper.ToTestResultResponse)
                .ToList() ?? new List<TestResultResponse>(),
            KeystrokeLogs = submission.KeystrokeLogs?
                .Select(_keystrokeMapper.ToKeystrokeLogResponse)
                .ToList() ?? new List<KeystrokeLogResponse>(),
            RegradingRequestId = submission.RegradingRequestId,
            LecturerFeedback = submission.LecturerFeedback,
            AiFeedback = submission.AiFeedback,
            UpdatedDate = submission.UpdatedDate
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

    /// <summary>
    /// Maps submission to response with optional problem and student info for UI display (e.g. submission detail).
    /// </summary>
    public SubmissionResponse ToResponse(Submission submission, ProblemLiteResponse? problem, StudentLiteResponse? student)
    {
        var response = ToResponse(submission, problem);
        response.Student = student;
        return response;
    }

    /// <summary>
    /// Maps user profile from AuthService to minimal student info for submission detail.
    /// </summary>
    public StudentLiteResponse? ToStudentLiteResponse(UserProfileResponse? profile)
    {
        if (profile == null) return null;
        return new StudentLiteResponse
        {
            StudentId = profile.Id,
            Fullname = profile.Fullname,
            Email = profile.Email,
            RoleNumber = profile.RoleNumber
        };
    }

    // Maps to a single auto-grade result for the response list. Use errorMessage == null for success, non-null for failure.
    public AutoGradeSubmissionResult ToAutoGradeSubmissionResult(
        SubmissionGradingRequest submissionReq,
        int totalTestCases,
        float finalScore = 0f,
        int passedTestCases = 0,
        string? errorMessage = null)
    {
        if (!string.IsNullOrEmpty(errorMessage))
        {
            return new AutoGradeSubmissionResult
            {
                SubmissionId = submissionReq.Id,
                StudentId = submissionReq.StudentId,
                FinalScore = 0f,
                Status = SubmissionStatus.PENDING.ToString(),
                GradedDate = default,
                PassedTestCases = 0,
                TotalTestCases = totalTestCases,
                ErrorMessage = errorMessage
            };
        }

        return new AutoGradeSubmissionResult
        {
            SubmissionId = submissionReq.Id,
            StudentId = submissionReq.StudentId,
            FinalScore = finalScore,
            Status = SubmissionStatus.GRADED.ToString(),
            GradedDate = DateTime.UtcNow,
            PassedTestCases = passedTestCases,
            TotalTestCases = totalTestCases
        };
    }
}