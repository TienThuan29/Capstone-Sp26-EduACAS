using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Web.Requests;
using AcasService.Repositories.Caching.Redis.Submission;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Problem;
using AcasService.Repositories.StudentExamSession;
using AcasService.Repositories.Submission;

namespace AcasService.Application.Commands.Submission;

public interface ISubmissionCommand
{
      Task<SubmissionResponse?> SubmitProblemAsync(SubmitProblemRequest request);
      Task<AutoGradeProblemResponse> AutoGradeAllSubmissionsOfProblemAysnc(BulkSubmissionGradingRequest bulkSubmissionGradingRequest);
}

public class SubmissionCommand : ISubmissionCommand
{
      private readonly ISubmissionRepository _submissionRepository;
      private readonly SubmissionMapper _submissionMapper;
      private readonly ISubmissionCache _submissionCache;
      private readonly ILogger<SubmissionCommand> _logger;
      private readonly IProblemRepository _problemRepository;
      private readonly ITestcaseEvaluator _testcaseEvaluator;
      private readonly IExaminationRepository _examinationRepository;
      private readonly IStudentExamSessionRepository _studentExamSessionRepository;
      private readonly TestResultMapper _testResultMapper;

      public SubmissionCommand(
          ISubmissionRepository submissionRepository,
          SubmissionMapper submissionMapper,
          ISubmissionCache submissionCache,
          ILogger<SubmissionCommand> logger,
          IProblemRepository problemRepository,
          ITestcaseEvaluator testcaseEvaluator,
          IExaminationRepository examinationRepository,
          IStudentExamSessionRepository studentExamSessionRepository,
          TestResultMapper testResultMapper)
      {
            _submissionRepository = submissionRepository;
            _submissionMapper = submissionMapper;
            _submissionCache = submissionCache;
            _logger = logger;
            _problemRepository = problemRepository;
            _testcaseEvaluator = testcaseEvaluator;
            _examinationRepository = examinationRepository;
            _studentExamSessionRepository = studentExamSessionRepository;
            _testResultMapper = testResultMapper;
      }

      public async Task<SubmissionResponse?> SubmitProblemAsync(SubmitProblemRequest request)
      {
            var examination = await _examinationRepository.GetByIdAsync(request.ExamId);
            if (examination != null && examination.Mode == Mode.EXAMINATION)
            {
                  var session = await _studentExamSessionRepository.GetByStudentAndExamAsync(request.StudentId, request.ExamId);
                  if (session == null || session.Phase != StudentExamSessionPhase.Active)
                  {
                        _logger.LogWarning(
                              "Submission rejected: student {StudentId} exam {ExamId} session phase invalid (session missing or not Active)",
                              request.StudentId, request.ExamId);
                        throw new InvalidOperationException("Exam session is not active. Start the exam from the exam page before submitting.");
                  }
            }

            var submission = _submissionMapper.ToEntity(request);

            var cacheKey = _submissionCache.GetSubmissionsListKey(request.StudentId, request.ExamId, request.ProblemId);
            var sameExamProblem = await _submissionCache.GetAsync<List<Models.Submission>>(cacheKey);

            if (sameExamProblem == null || sameExamProblem.Count == 0)
            {
                  var existingSubmissions = await _submissionRepository.GetByStudentIdAsync(request.StudentId);
                  sameExamProblem = existingSubmissions
                      .Where(s => s.ExamId == request.ExamId && s.ProblemId == request.ProblemId)
                      .ToList();
            }

            submission.Version = sameExamProblem.Count == 0 ? 1 : sameExamProblem.Max(s => s.Version) + 1;

            var created = await _submissionRepository.CreateAsync(submission);
            if (created == null)
            {
                  _logger.LogWarning("Failed to create submission for student {StudentId}, exam {ExamId}, problem {ProblemId}",
                      request.StudentId, request.ExamId, request.ProblemId);
                  return null;
            }

            // save new list submissions to cache
            var newList = sameExamProblem.Append(created).ToList();
            await _submissionCache.SetAsync(cacheKey, newList);

            return _submissionMapper.ToResponse(created);
      }

      public async Task<AutoGradeProblemResponse> AutoGradeAllSubmissionsOfProblemAysnc(BulkSubmissionGradingRequest bulkSubmissionGradingRequest)
      {
            var problemId = bulkSubmissionGradingRequest.ProblemId;
            var examId = bulkSubmissionGradingRequest.ExamId;
            var results = new List<AutoGradeSubmissionResult>();
            var response = new AutoGradeProblemResponse
            {
                  ProblemId = problemId,
                  ExamId = examId,
                  TotalSubmissions = bulkSubmissionGradingRequest.Submissions.Count,
                  Results = results
            };

            var problem = await _problemRepository.GetByIdAsync(problemId);
            if (problem == null)
            {
                  _logger.LogWarning("Problem {ProblemId} not found for auto-grading", problemId);
                  return response;
            }

            // get hidden testcases to run for each submission
            var hiddenTestCases = problem.TestCases
                .Where(tc => !tc.IsDeleted && !tc.IsPublic)
                .ToList();

            if (hiddenTestCases.Count == 0)
            {
                  _logger.LogInformation("Problem {ProblemId} has no hidden test cases; skipping auto-grading", problemId);
                  return response;
            }

            var exam = await _examinationRepository.GetByIdAsync(examId);
            var problemMark = exam?.Problems?.FirstOrDefault(p => p.ProblemId == problemId)?.Mark ?? 0f;

            var requestTestCases = hiddenTestCases.Select(MapToRequestTestCase).ToList();
            var stdinList = hiddenTestCases.Select(tc => tc.InputData).ToList();

            foreach (var submissionReq in bulkSubmissionGradingRequest.Submissions)
            {
                  var runBatchRequest = new RumBatchRequest
                  {
                        Source = submissionReq.Source,
                        Options = new CompileOptions(),
                        StdinList = stdinList,
                        TestCases = requestTestCases
                  };

                  try
                  {
                        var testResults = await _testcaseEvaluator.ExecuteTestcasesAsync(
                            submissionReq.CompilerId,
                            runBatchRequest,
                            submissionReq.LanguageId
                        );
                        // calc final score
                        var finalScore = CalculateSubmissionScore(testResults, problemMark);
                        var passedCount = testResults.Count(r => r.Status == TestcaseStatus.SUCCESS.ToString());

                        var entity = await _submissionRepository.GetByIdAsync(submissionReq.Id);
                        if (entity != null)
                        {
                              var now = DateTime.UtcNow;
                              entity.FinalScore = finalScore;
                              // Save test case results list into Submission.TestResults; persisted by UpdateAsync
                              entity.TestResults = testResults.Select(_testResultMapper.ToEntity).ToList();
                              entity.Status = SubmissionStatus.GRADED;
                              entity.GradedDate = now;
                              entity.UpdatedDate = now;
                              await _submissionRepository.UpdateAsync(entity);
                        }

                        _logger.LogInformation(
                            "Auto-graded submission {SubmissionId}: {Count} test result(s), final score {Score}",
                            submissionReq.Id,
                            testResults.Count,
                            finalScore);

                        results.Add(_submissionMapper.ToAutoGradeSubmissionResult(
                            submissionReq,
                            testResults.Count,
                            finalScore,
                            passedCount));
                  }
                  catch (Exception ex)
                  {
                        _logger.LogError(ex, "Failed to execute hidden test cases for submission {SubmissionId}", submissionReq.Id);
                        results.Add(_submissionMapper.ToAutoGradeSubmissionResult(
                            submissionReq,
                            hiddenTestCases.Count,
                            errorMessage: ex.Message));
                  }
            }

            response.GradedCount = results.Count(r => string.IsNullOrEmpty(r.ErrorMessage));
            response.FailedCount = results.Count(r => !string.IsNullOrEmpty(r.ErrorMessage));
            return response;
      }

      // calc final mark for the submission: (successCount / totalCount) * problemMark.
      private static float CalculateSubmissionScore(List<TestResultResponse> testResults, float problemMark)
      {
            if (testResults.Count == 0 || problemMark <= 0f)
                  return 0f;
            var successCount = testResults.Count(r => r.Status == TestcaseStatus.SUCCESS.ToString());
            return (successCount / (float)testResults.Count) * problemMark;
      }

      private AcasService.Web.Requests.TestCase MapToRequestTestCase(Models.TestCase tc)
      {
            return new AcasService.Web.Requests.TestCase
            {
                  Id = tc.Id,
                  ProblemId = tc.ProblemId,
                  InputData = tc.InputData,
                  ExpectedOutput = tc.ExpectedOutput,
                  IsPublic = tc.IsPublic,
                  IsCaseInsensitive = tc.IsCaseInsensitive,
                  IsFloatingPoint = tc.IsFloatingPoint,
                  FloatingPointTolerance = tc.FloatingPointTolerance,
                  DecimalPlaces = tc.DecimalPlaces,
                  IsTokenComparision = tc.IsTokenComparision,
                  IsNotOrderedComparision = tc.IsNotOrderedComparision
            };
      }
}
