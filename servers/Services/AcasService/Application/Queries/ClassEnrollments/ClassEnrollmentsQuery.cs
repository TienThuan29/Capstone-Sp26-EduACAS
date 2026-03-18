using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Repositories.ClassroomEnrollment;

namespace AcasService.Application.Queries.ClassEnrollments;

public interface IClassEnrollmentsQuery
{
    Task<List<ClassroomStudentResponse>> GetStudentsByClassIdAsync(string classId, CancellationToken cancellationToken = default);
}

public class ClassEnrollmentsQuery : IClassEnrollmentsQuery
{
    private readonly IClassroomEnrollmentRepository _enrollmentRepository;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ClassEnrollmentMapper _classEnrollmentMapper;
    
    public ClassEnrollmentsQuery(
        IClassroomEnrollmentRepository enrollmentRepository,
        UserRequestProducer userRequestProducer,
        ClassEnrollmentMapper classEnrollmentMapper)
    {
        _enrollmentRepository = enrollmentRepository;
        _userRequestProducer = userRequestProducer;
        _classEnrollmentMapper = classEnrollmentMapper;
    }

    public async Task<List<ClassroomStudentResponse>> GetStudentsByClassIdAsync(string classId, CancellationToken cancellationToken = default)
    {
        var enrollments = await _enrollmentRepository.FindByClassIdAsync(classId);
        var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

        var userProfileTasks = studentIds.Select(id => _userRequestProducer.GetUserByIdAsync(id, cancellationToken));
        var userProfiles = await Task.WhenAll(userProfileTasks);
        var userById = studentIds
            .Zip(userProfiles, (id, profile) => (id, profile))
            .ToDictionary(x => x.id, x => x.profile);

        return enrollments
            .Select(e => _classEnrollmentMapper.ToClassroomStudentResponse(e, userById.GetValueOrDefault(e.StudentId)))
            .ToList();
    }
}