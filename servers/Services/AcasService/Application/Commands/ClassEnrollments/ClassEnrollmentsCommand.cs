
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Application.ClassroomEnrollment;
using AcasService.Application.ClassroomEnrollment.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.ClassroomEnrollment;

public interface IClassEnrollmentsCommand
{
    Task<ClassEnrollmentsResponse> EnrollClass(ClassEnrollmentsRequest request);
}


public class ClassEnrollmentsCommand : IClassEnrollmentsCommand
{
    private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;
    private readonly IClassroomRepository _classroomRepository;

    public ClassEnrollmentsCommand(IClassroomEnrollmentRepository classroomEnrollmentRepository, IClassroomRepository classroomRepository)
    {
        _classroomEnrollmentRepository = classroomEnrollmentRepository;
        _classroomRepository = classroomRepository;
    }


    public async Task<ClassEnrollmentsResponse> EnrollClass(ClassEnrollmentsRequest request)
    {


        var classroom = await _classroomRepository.FindByEnrollKeyAsync(request.EnrolKey);
        if (classroom == null)
        {
            throw new InvalidOperationException("Invalid enrollment key");
        }
        if (classroom.Id != request.ClassId)
        {
            throw new InvalidOperationException("Enrollment key does not belong to this class");
        }

        var enrollment = new ClassEnrollment
        {
            Id = Guid.NewGuid().ToString(),
            ClassId = classroom.Id,
            StudentId = request.StudentId,
            JoinedDate = DateTime.UtcNow,
            IsJoining = true,
            MovedOutDate = default
        };

        var createdEnrollment = await _classroomEnrollmentRepository.CreateAsync(enrollment);
        if (createdEnrollment == null)
        {
            throw new Exception("Failed to enroll in class");
        }


        var response = new ClassEnrollmentsResponse
        {
            EnrollmentId = createdEnrollment.Id,
            ClassId = createdEnrollment.ClassId,
            StudentId = createdEnrollment.StudentId,
            JoinedDate = createdEnrollment.JoinedDate,
            IsJoining = createdEnrollment.IsJoining,
            MovedOutDate = createdEnrollment.MovedOutDate
        };
        return response;

    }
}
