using AcasService.Repositories.Caching.Redis.Submission;
using AcasService.Repositories.Submission;

namespace AcasService.Application.Queries.Submission;

public interface ISubmissionQuery
{
      Task<List<Models.Submission>> GetSubmissionsByStudentIdAsync(string studentId);

      Task<List<Models.Submission>> GetTheLatestVersionSubmissionsByExamAndProblemAsync(string examId, string problemId);
}

public class SubmissionQuery : ISubmissionQuery
{
      private readonly ISubmissionCache _submissionCache;
      private readonly ISubmissionRepository _submissionRepository;

      public SubmissionQuery(
            ISubmissionRepository submissionRepository,
            ISubmissionCache submissionCache)
      {
            _submissionRepository = submissionRepository;
            _submissionCache = submissionCache;
      }

      public Task<List<Models.Submission>> GetSubmissionsByStudentIdAsync(string studentId) =>
            _submissionRepository.GetByStudentIdAsync(studentId);

      public Task<List<Models.Submission>> GetTheLatestVersionSubmissionsByExamAndProblemAsync(string examId, string problemId) =>
            _submissionRepository.GetLatestVersionSubmissionsOfProblemInExam(examId, problemId);
}