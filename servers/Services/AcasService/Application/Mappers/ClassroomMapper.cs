using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;

namespace AcasService.Application.Mappers;
public class ClassroomMapper
{
    public ClassroomResponse ToClassroomResponse(Classroom classroom, Subject subject, UserProfileResponse? lecturerProfile)
    {
        return ToClassroomResponse(classroom, subject, lecturerProfile, 0);
    }

    public ClassroomResponse ToClassroomResponse(Classroom classroom, Subject subject, UserProfileResponse? lecturerProfile, int studentCount)
    {
        var subjectLite = new SubjectLiteResponse();
        if (subject != null)
        {
            subjectLite.Id = subject.Id;
            subjectLite.SubjectName = subject.SubjectName;
        }
        else
        {
            subjectLite.Id = "UNKNOWN SUBJECT";
            subjectLite.SubjectName = "UNKNOWN SUBJECT";
        }

        var lecturerLite = new LecturerLiteResponse();
        if (lecturerProfile != null)
        {
            lecturerLite.Id = lecturerProfile.Id;
            lecturerLite.Fullname = lecturerProfile.Fullname;
            lecturerLite.Email = lecturerProfile.Email;
            lecturerLite.AvatarUrl = lecturerProfile.AvatarUrl;
        }
        else
        {
            lecturerLite.Id = "UNKNOWN LECTURER";
            lecturerLite.Fullname = "UNKNOWN LECTURER";
            lecturerLite.Email = "UNKNOWN LECTURER";
            lecturerLite.AvatarUrl = "UNKNOWN LECTURER";
        }

        return new ClassroomResponse
        {
            Id = classroom.Id,
            ClassCode = classroom.ClassCode,
            ClassName = classroom.ClassName,
            Lecturer = lecturerLite,
            Subject = subjectLite,
            SemesterName = classroom.SemesterName,
            EnrolKey = classroom.EnrolKey,
            CreatedDate = classroom.CreatedDate,
            UpdatedDate = classroom.UpdatedDate,
            MaxSlot = classroom.MaxSlot,
            EndDate = classroom.EndDate,
            IsDeleted = classroom.IsDeleted,
            StudentCount = studentCount
        };
    }

    public ClassroomResponse ToClassroomResponse(
        Classroom classroom,
        Subject subject,
        UserProfileResponse? lecturerProfile,
        ClassEnrollment? classEnrollment
    )
    {
        return ToClassroomResponse(classroom, subject, lecturerProfile, classEnrollment, 0);
    }

    public ClassroomResponse ToClassroomResponse(
        Classroom classroom,
        Subject subject,
        UserProfileResponse? lecturerProfile,
        ClassEnrollment? classEnrollment,
        int studentCount
    )
    {

        var response = ToClassroomResponse(classroom, subject, lecturerProfile, studentCount);


        var enrollmentInfo = new EnrollmentInfoResponse();

        if (classEnrollment != null)
        {
            enrollmentInfo.IsJoining = classEnrollment.IsJoining;
            enrollmentInfo.JoinedDate = classEnrollment.IsJoining
                ? classEnrollment.JoinedDate
                : null;
            enrollmentInfo.MovedOutDate = classEnrollment.IsJoining
                ? null
                : classEnrollment.MovedOutDate;
        }
        else
        {
            enrollmentInfo.IsJoining = false;
            enrollmentInfo.JoinedDate = null;
            enrollmentInfo.MovedOutDate = null;
        }

        response.Enrollment = enrollmentInfo;
        return response;
    }

}


public class ClassEnrollmentMapper
{
    public ClassroomStudentResponse ToClassroomStudentResponse(ClassEnrollment enrollment, UserProfileResponse? userProfile)
    {
        return new ClassroomStudentResponse
        {
            EnrollmentId = enrollment.Id,
            StudentId = enrollment.StudentId,
            JoinedDate = enrollment.JoinedDate,
            IsJoining = enrollment.IsJoining,
            RoleNumber = userProfile?.RoleNumber ?? string.Empty,
            Email = userProfile?.Email ?? string.Empty,
            Fullname = userProfile?.Fullname ?? string.Empty,
            AvatarUrl = userProfile?.AvatarUrl ?? string.Empty,
            Birthday = userProfile?.Birthday,
            Role = userProfile?.Role ?? string.Empty,
            IsEnable = userProfile?.IsEnable ?? false
        };
    }

    public ClassEnrollmentsResponse ToClassEnrollmentsResponse(ClassEnrollment enrollment)
    {
        return new ClassEnrollmentsResponse
        {
            EnrollmentId = enrollment.Id,
            ClassId = enrollment.ClassId,
            StudentId = enrollment.StudentId,
            JoinedDate = enrollment.JoinedDate,
            IsJoining = enrollment.IsJoining,
            MovedOutDate = enrollment.MovedOutDate
        };
    }
}
