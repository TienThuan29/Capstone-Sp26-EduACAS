using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Repositories.StudentExamSession;

namespace AcasService.Application.Queries.StudentExamSession;

public interface IStudentExamSessionQuery
{
    Task<List<StudentExamSessionResponse>> GetSessionsByExamIdAsync(string examId);
}

public class StudentExamSessionQuery : IStudentExamSessionQuery
{
    private readonly ILogger<StudentExamSessionQuery> _logger;
    private readonly IStudentExamSessionRepository _repository;
    private readonly UserRequestProducer _userRequestProducer;

    public StudentExamSessionQuery(
        ILogger<StudentExamSessionQuery> logger,
        IStudentExamSessionRepository repository,
        UserRequestProducer userRequestProducer)
    {
        _logger = logger;
        _repository = repository;
        _userRequestProducer = userRequestProducer;
    }

    public async Task<List<StudentExamSessionResponse>> GetSessionsByExamIdAsync(string examId)
    {
        try
        {
            var sessions = await _repository.GetByExamIdAsync(examId);
            if (sessions.Count == 0)
                return new List<StudentExamSessionResponse>();

            var studentIds = sessions.Select(s => s.StudentId).Distinct().ToList();
            var userProfiles = await _userRequestProducer.GetUsersByIdsAsync(studentIds);
            var userById = userProfiles.ToDictionary(u => u.Id, u => u);

            var responses = sessions
                .Select(session =>
                {
                    var userProfile = userById.GetValueOrDefault(session.StudentId);
                    return new StudentExamSessionResponse
                    {
                        Id = session.Id,
                        StudentId = session.StudentId,
                        StudentName = userProfile?.Fullname ?? string.Empty,
                        StudentRoleNumber = userProfile?.RoleNumber ?? string.Empty,
                        ExamId = session.ExamId,
                        ClassroomId = session.ClassroomId,
                        Phase = session.Phase.ToString(),
                        ActiveProblemId = session.ActiveProblemId,
                        LockReason = session.LockReason,
                        CreatedDate = session.CreatedDate,
                        UpdatedDate = session.UpdatedDate,
                    };
                })
                .ToList();

            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching sessions for exam {ExamId}", examId);
            throw;
        }
    }
}
