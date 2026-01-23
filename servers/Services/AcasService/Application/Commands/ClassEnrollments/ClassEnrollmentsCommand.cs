
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

    Task<ClassEnrollmentsResponse> LeaveClass(ClassEnrollmentsRequest request);
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

        var existingEnrollment = await _classroomEnrollmentRepository.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId);
        if (existingEnrollment != null)
        {
            throw new InvalidOperationException("Student is already enrolled in this class");
        }
    
        var enrollment = new ClassEnrollment
        {
            Id = Guid.NewGuid().ToString(),
            ClassId = classroom.Id,
            StudentId = request.StudentId,            
            JoinedDate = DateTime.UtcNow,
            IsJoining = true,
            MovedOutDate = null
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

    public async Task<ClassEnrollmentsResponse> LeaveClass(ClassEnrollmentsRequest request)
    {
        var classEnrollment = await _classroomEnrollmentRepository.FindByClassAndStudentIdAsync(request.ClassId, request.StudentId);
        if (classEnrollment == null)
        {
            throw new InvalidOperationException("Student is not enrolled in this class");
        }
        classEnrollment.MovedOutDate = DateTime.UtcNow;
        classEnrollment.IsJoining = false;

        var updatedEnrollment = await _classroomEnrollmentRepository.UpdateAsync(classEnrollment);
        if (updatedEnrollment == null)
        {
            throw new Exception("Failed to leave class");
        }
        var response = new ClassEnrollmentsResponse
        {
            EnrollmentId = updatedEnrollment.Id,
            ClassId = updatedEnrollment.ClassId,
            StudentId = updatedEnrollment.StudentId,
            JoinedDate = updatedEnrollment.JoinedDate,
            IsJoining = updatedEnrollment.IsJoining,
            MovedOutDate = updatedEnrollment.MovedOutDate
        };

        return response;
    }
}
