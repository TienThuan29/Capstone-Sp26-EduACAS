using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;

namespace AcasService.Application.Mappers;

public class ExaminationMapper
{
    public ExaminationResponseDTO ToExaminationResponse(Models.Examination exam)
    {
        return new ExaminationResponseDTO
        {
            Id = exam.Id,
            ExamName = exam.ExamName,
            ProgrammingLanguageId = exam.ProgrammingLanguageId,
            ProblemIds = exam.ProblemIds,
            ClassroomId = exam.ClassroomId,
            StartDatetime = exam.StartDatetime,
            EndDatetime = exam.EndDatetime,
            Description = exam.Description,
            IsPublicResult = exam.IsPublicResult,
            TotalMark = exam.TotalMark,
            Status = exam.Status,
            Mode = exam.Mode,
            IsDeleted = exam.IsDeleted,
            CreatedDate = exam.CreatedDate,
            UpdatedDate = exam.UpdatedDate
        };
    }

    public Models.Examination ToExaminationModel(ExaminationRequestDTO examRequest)
    {
        return new Models.Examination
        {
            ExamName = examRequest.ExamName,
            ProgrammingLanguageId = examRequest.ProgrammingLanguageId,
            ProblemIds = examRequest.ProblemIds,
            ClassroomId = examRequest.ClassroomId,
            StartDatetime = examRequest.StartDatetime,
            EndDatetime = examRequest.EndDatetime,
            Description = examRequest.Description,
            IsPublicResult = examRequest.IsPublicResult,
            TotalMark = examRequest.TotalMark,
            Status = examRequest.Status,
            Mode = examRequest.Mode
        };
    }
}

