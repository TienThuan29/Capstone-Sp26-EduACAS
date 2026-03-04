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