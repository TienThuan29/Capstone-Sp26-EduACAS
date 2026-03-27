using AcasService.Application.Mappers;
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

      Task<List<ProblemSubmissionsResponse>> GetLatestSubmissionsByExamAsync(string examId);
}

public class SubmissionQuery : ISubmissionQuery
{
      private readonly ISubmissionCache _submissionCache;
      private readonly ISubmissionRepository _submissionRepository;
      private readonly IProblemQuery _problemQuery;
      private readonly UserRequestProducer _userRequestProducer;
      private readonly SubmissionMapper _submissionMapper;

      public SubmissionQuery(
            ISubmissionRepository submissionRepository,
            ISubmissionCache submissionCache,
            IProblemQuery problemQuery,
            UserRequestProducer userRequestProducer,
            SubmissionMapper submissionMapper)
      {
            _submissionRepository = submissionRepository;
            _submissionCache = submissionCache;
            _problemQuery = problemQuery;
            _userRequestProducer = userRequestProducer;
            _submissionMapper = submissionMapper;
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

      public async Task<List<ProblemSubmissionsResponse>> GetLatestSubmissionsByExamAsync(string examId)
      {
            var byProblem = await _submissionRepository.GetLatestVersionSubmissionsByExamAsync(examId).ConfigureAwait(false);
            var problemIds = byProblem.Keys.ToList();
            if (problemIds.Count == 0)
                  return new List<ProblemSubmissionsResponse>();

            var problems = await _problemQuery.GetProblemsByIdsAsync(problemIds).ConfigureAwait(false);
            var problemLiteById = problems.ToDictionary(p => p.Id, p => new ProblemLiteResponse { Id = p.Id, Title = p.Title });

            var studentIds = byProblem.Values.SelectMany(list => list.Select(s => s.StudentId)).Distinct().ToList();
            var studentProfiles = await _userRequestProducer.GetUsersByIdsAsync(studentIds).ConfigureAwait(false);
            var studentById = studentProfiles.ToDictionary(p => p.Id, p => _submissionMapper.ToStudentLiteResponse(p));

            return byProblem
                .Select(kv => new ProblemSubmissionsResponse
                {
                    ProblemId = kv.Key,
                    Submissions = kv.Value
                        .Select(s => _submissionMapper.ToResponse(
                            s, 
                            problemLiteById.GetValueOrDefault(kv.Key),
                            studentById.GetValueOrDefault(s.StudentId)))
                        .ToList()
                })
                .ToList();
      }
}