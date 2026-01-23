using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;

namespace AcasService.Application.Mappers
{
    public class ClassroomMapper
    {
        public ClassroomResponse ToClassroomResponse(Classroom classroom, Subject subject, UserProfileResponse? lecturerProfile)
        {
            var subjectLite = new SubjectLiteResponse();
            if (subject != null)
            {
                subjectLite.Id = subject.Id;
                subjectLite.SubjectName = subject.SubjectName;
            } else
            {
                subjectLite.Id = "UNKNOWN SUBJECT";
                subjectLite.SubjectName = "UNKNOWN SUBJECT";
            }

            var lecturerLite = new LecturerLiteResponse();
            if(lecturerProfile != null)
            {
                lecturerLite.Id = lecturerProfile.Id;
                lecturerLite.LecturerName = lecturerProfile.Fullname;
            }
            else
            {
                lecturerLite.Id = "UNKNOWN LECTURER";
                lecturerLite.LecturerName = "UNKNOWN LECTURER";
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
                EndDate = classroom.EndDate,
                IsDeleted = classroom.IsDeleted
            };
        }
    }
}
