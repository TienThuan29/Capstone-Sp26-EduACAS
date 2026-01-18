using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers
{
    public class ClassroomMapper
    {
        public ClassroomResponse ToClassroomResponse(Classroom classroom)
        {
            return new ClassroomResponse
            {
                Id = classroom.Id,
                ClassCode = classroom.ClassCode,
                ClassName = classroom.ClassName,
                LecturerId = classroom.LecturerId,
                SubjectId = classroom.SubjectId,
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
