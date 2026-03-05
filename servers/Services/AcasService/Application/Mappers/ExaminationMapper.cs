using System.Linq;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ExaminationMapper
{
    public ExaminationResponse ToExaminationResponse(Examination exam, Classroom classroom, ProgrammingLanguage programmingLanguage)
    {
        var classroomLite = new ClassroomLiteResponse
        {
            Id = classroom.Id,
            ClassName = classroom.ClassName
        };

        var programmingLanguageMapper = new ProgrammingLanguageMapper();
        var programmingLanguageResponse = programmingLanguageMapper.ToProgrammingLanguageResponse(programmingLanguage);

        return new ExaminationResponse
        {
            Id = exam.Id,
            ExamName = exam.ExamName,
            ProgrammingLanguage = programmingLanguageResponse,
            ExamProblems = exam.Problems?.Select(p => new ExaminationProblemResponse { ProblemId = p.ProblemId, Mark = p.Mark}).ToList() ?? new List<ExaminationProblemResponse>(),
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

    public Examination ToExaminationModel(ExaminationRequestDTO examRequest)
    {
        if (!Enum.TryParse<Mode>(examRequest.Mode, true, out var mode))
            throw new InvalidOperationException($"Invalid Mode: {examRequest.Mode}");
        if (!Enum.TryParse<Status>(examRequest.Status, true, out var status))
            throw new InvalidOperationException($"Invalid Status: {examRequest.Status}");
        return new Models.Examination
        {
            ExamName = examRequest.ExamName,
            ProgrammingLanguageId = examRequest.ProgrammingLanguageId,
            Problems = examRequest.Problems?.Select(p => new ExaminationProblem { ProblemId = p.ProblemId, Mark = p.Mark }).ToList() ?? new List<ExaminationProblem>(),
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

    public ExaminationSpecProblemResponse ToExaminationWithSpecProblem(Examination exam, ProblemResponse problemResponse, ProgrammingLanguage? programmingLanguage)
    {
        var classroomLite = new ClassroomLiteResponse
        {
            Id = exam.ClassroomId,
            ClassName = string.Empty
        };

        var programmingLanguageMapper = new ProgrammingLanguageMapper();
        var programmingLanguageResponse = programmingLanguage != null
            ? programmingLanguageMapper.ToProgrammingLanguageResponse(programmingLanguage)
            : new ProgrammingLanguageResponse();

        return new ExaminationSpecProblemResponse
        {
            Id = exam.Id,
            ExamName = exam.ExamName,
            ProgrammingLanguage = programmingLanguageResponse,
            Problem = problemResponse,
            Classroom = classroomLite,
            StartDatetime = exam.StartDatetime,
            EndDatetime = exam.EndDatetime,
            Description = exam.Description,
            Mode = exam.Mode
        };
    }
}

