using AcasService.Application.Queries.Problem;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Repositories.Caching.Redis.Submission;
using AcasService.Repositories.Submission;

namespace AcasService.Application.Queries.Submission;

public interface ISubmissionQuery
{
      Task<Models.Submission?> GetSubmissionByIdAsync(string id);

      Task<(Models.Submission? Submission, ProblemResponse? Problem, UserProfileResponse? StudentProfile)> GetSubmissionDetailByIdAsync(string id);

      Task<List<Models.Submission>> GetSubmissionsByStudentIdAsync(string studentId);

      Task<List<Models.Submission>> GetTheLatestVersionSubmissionsByExamAndProblemAsync(string examId, string problemId);
}

public class SubmissionQuery : ISubmissionQuery
{
      private readonly ISubmissionCache _submissionCache;
      private readonly ISubmissionRepository _submissionRepository;
      private readonly IProblemQuery _problemQuery;
      private readonly UserRequestProducer _userRequestProducer;

      public SubmissionQuery(
            ISubmissionRepository submissionRepository,
            ISubmissionCache submissionCache,
            IProblemQuery problemQuery,
            UserRequestProducer userRequestProducer)
      {
            _submissionRepository = submissionRepository;
            _submissionCache = submissionCache;
            _problemQuery = problemQuery;
            _userRequestProducer = userRequestProducer;
      }

      public Task<Models.Submission?> GetSubmissionByIdAsync(string id) =>
            _submissionRepository.GetByIdAsync(id);

      public async Task<(Models.Submission? Submission, ProblemResponse? Problem, UserProfileResponse? StudentProfile)> GetSubmissionDetailByIdAsync(string id)
      {
            var submission = await _submissionRepository.GetByIdAsync(id).ConfigureAwait(false);
            if (submission == null)
                  return (null, null, null);

            var problem = await _problemQuery.GetProblemByIdAsync(submission.ProblemId).ConfigureAwait(false);
            var studentProfile = await _userRequestProducer.GetUserByIdAsync(submission.StudentId).ConfigureAwait(false);
            return (submission, problem, studentProfile);
      }

      public Task<List<Models.Submission>> GetSubmissionsByStudentIdAsync(string studentId) =>
            _submissionRepository.GetByStudentIdAsync(studentId);

      public Task<List<Models.Submission>> GetTheLatestVersionSubmissionsByExamAndProblemAsync(string examId, string problemId) =>
            _submissionRepository.GetLatestVersionSubmissionsOfProblemInExam(examId, problemId);
}