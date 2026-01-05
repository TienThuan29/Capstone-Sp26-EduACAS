using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Web.Requests;

namespace AcasService.Application.Mappers
{
    public class SubjectMapper
    {
        public SubjectResponse ToSubjectResponse(Subject subject)
        {
            return new SubjectResponse
            {
                Id = subject.Id,
                SubjectCode = subject.SubjectCode,
                SubjectName = subject.SubjectName,
                Description = subject.Description,
                CreatedBy = subject.CreatedBy,
                IsDeleted = subject.IsDeleted,
                CreatedDate = subject.CreatedDate,
                UpdatedDate = subject.UpdatedDate
            };
        }


    }
}
