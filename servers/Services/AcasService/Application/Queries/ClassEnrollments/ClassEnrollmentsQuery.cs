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

    public ClassEnrollmentsQuery(
        IClassroomEnrollmentRepository enrollmentRepository,
        UserRequestProducer userRequestProducer)
    {
        _enrollmentRepository = enrollmentRepository;
        _userRequestProducer = userRequestProducer;
    }

    public async Task<List<ClassroomStudentResponse>> GetStudentsByClassIdAsync(string classId, CancellationToken cancellationToken = default)
    {
        var enrollments = await _enrollmentRepository.FindByClassIdAsync(classId);
        var result = new List<ClassroomStudentResponse>();

        foreach (var enrollment in enrollments)
        {
            var userProfile = await _userRequestProducer.GetUserByIdAsync(enrollment.StudentId, cancellationToken);
            result.Add(ClassroomStudentMapper.ToClassroomStudentResponse(enrollment, userProfile));
        }

        return result;
    }
}