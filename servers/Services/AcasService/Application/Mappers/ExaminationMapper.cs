using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Models;
namespace AcasService.Application.Mappers;

public class ExaminationMapper
{
    public ExaminationResponse ToExaminationResponse(Examination exam,Classroom classroom,ProgrammingLanguage programmingLanguage )
    {
        var classroomLite = new ClassroomLiteResponse();
        classroomLite.Id=classroom.Id;
        classroomLite.ClassName=classroom.ClassName;

        var programmingLanguageLite = new ProgrammingLanguageLiteResponse();
        programmingLanguageLite.Id=programmingLanguage.Id;
        programmingLanguageLite.Name=programmingLanguage.LanguageName;

        return new ExaminationResponse
        {
            Id = exam.Id,
            ExamName = exam.ExamName,
           ProgrammingLanguage =programmingLanguageLite,
            ProblemIds = exam.ProblemIds,
            Classroom = classroomLite,
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
        if (!Enum.TryParse<Mode>(examRequest.Mode, true, out var mode))
            throw new InvalidOperationException($"Invalid Mode: {examRequest.Mode}");
        if (!Enum.TryParse<Status>(examRequest.Status, true, out var status))
            throw new InvalidOperationException($"Invalid Status: {examRequest.Status}");
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
            Status = status,
            Mode = mode
        };
    }
}

