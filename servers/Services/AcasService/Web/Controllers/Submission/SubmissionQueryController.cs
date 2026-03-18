using AcasService.Application.Mappers;
using AcasService.Application.Queries.Problem;
using AcasService.Application.Queries.Submission;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Submission;

[ApiController]
[Route("api/v1/submissions")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class SubmissionQueryController : ControllerBase
{
      private readonly ISubmissionQuery _submissionQuery;
      private readonly IProblemQuery _problemQuery;
      private readonly SubmissionMapper _submissionMapper;
      private readonly ILogger<SubmissionQueryController> _logger;

      public SubmissionQueryController(
            ISubmissionQuery submissionQuery,
            IProblemQuery problemQuery,
            SubmissionMapper submissionMapper,
            ILogger<SubmissionQueryController> logger)
      {
            _submissionQuery = submissionQuery;
            _problemQuery = problemQuery;
            _submissionMapper = submissionMapper;
            _logger = logger;
      }

      [HttpGet("{id}")]
      public async Task<ActionResult<ApiResponse<SubmissionResponse>>> GetById([FromRoute] string id)
      {
            try
            {
                  var (submission, problem, studentProfile) = await _submissionQuery.GetSubmissionDetailByIdAsync(id);
                  if (submission == null)
                        return ResponseUtil.Error<SubmissionResponse>("Submission not found", 404);

                  ProblemLiteResponse? problemLite = null;
                  if (problem != null)
                        problemLite = new ProblemLiteResponse { Id = problem.Id, Title = problem.Title };

                  var studentLite = _submissionMapper.ToStudentLiteResponse(studentProfile);
                  var response = _submissionMapper.ToResponse(submission, problemLite, studentLite);
                  return ResponseUtil.Success(response, "Submission retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Error getting submission {Id}", id);
                  return ResponseUtil.Error<SubmissionResponse>("Failed to get submission", 500);
            }
      }

      [HttpGet("student/{studentId}")]
      public async Task<ActionResult<ApiResponse<List<SubmissionResponse>>>> GetByStudentId([FromRoute] string studentId)
      {
            try
            {
                  var submissions = await _submissionQuery.GetSubmissionsByStudentIdAsync(studentId);
                  var response = submissions.Select(_submissionMapper.ToResponse).ToList();
                  return ResponseUtil.Success(response, "Submissions retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Error getting submissions for student {StudentId}", studentId);
                  return ResponseUtil.Error<List<SubmissionResponse>>("Failed to get submissions", 500);
            }
      }

      [HttpGet("exam/{examId}/latest-all")]
      public async Task<ActionResult<ApiResponse<List<ProblemSubmissionsResponse>>>> GetLatestSubmissionsByExam([FromRoute] string examId)
      {
            try
            {
                  if (string.IsNullOrWhiteSpace(examId))
                        return ResponseUtil.Error<List<ProblemSubmissionsResponse>>("Exam ID is required.", 400);
                  var result = await _submissionQuery.GetLatestSubmissionsByExamAsync(examId);
                  return ResponseUtil.Success(result, $"Retrieved latest submissions for {result.Count} problem(s).");
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Error getting latest submissions for exam {ExamId}", examId);
                  return ResponseUtil.Error<List<ProblemSubmissionsResponse>>("Failed to get latest submissions", 500);
            }
      }

      [HttpGet("exam/{examId}/problem/{problemId}/latest")]
      public async Task<ActionResult<ApiResponse<List<SubmissionResponse>>>> GetLatestByExamAndProblem(
            [FromRoute] string examId,
            [FromRoute] string problemId)
      {
            try
            {
                  var submissions = await _submissionQuery.GetTheLatestVersionSubmissionsByExamAndProblemAsync(examId, problemId);
                  ProblemLiteResponse? problemLite = null;
                  var problem = await _problemQuery.GetProblemByIdAsync(problemId);
                  if (problem != null)
                  {
                        problemLite = new ProblemLiteResponse
                        {
                              Id = problem.Id,
                              Title = problem.Title
                        };
                  }
                  var response = submissions
                        .Select(s => _submissionMapper.ToResponse(s, problemLite))
                        .ToList();
                  return ResponseUtil.Success(response, "Latest submissions retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Error getting latest submissions for exam {ExamId}, problem {ProblemId}", examId, problemId);
                  return ResponseUtil.Error<List<SubmissionResponse>>("Failed to get latest submissions", 500);
            }
      }
}