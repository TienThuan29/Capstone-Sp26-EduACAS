using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Caching.Redis.Submission;
using AcasService.Repositories.Submission;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Submission;

public interface ISubmissionCommand
{
      Task<SubmissionResponse?> SubmitProblemAsync(SubmitProblemRequest request);
}

public class SubmissionCommand : ISubmissionCommand
{
      private readonly ISubmissionRepository _submissionRepository;
      private readonly SubmissionMapper _submissionMapper;
      private readonly ISubmissionCache _submissionCache;
      private readonly ILogger<SubmissionCommand> _logger;

      public SubmissionCommand(
          ISubmissionRepository submissionRepository,
          SubmissionMapper submissionMapper,
          ISubmissionCache submissionCache,
          ILogger<SubmissionCommand> logger)
      {
            _submissionRepository = submissionRepository;
            _submissionMapper = submissionMapper;
            _submissionCache = submissionCache;
            _logger = logger;
      }

      public async Task<SubmissionResponse?> SubmitProblemAsync(SubmitProblemRequest request)
      {
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
}
