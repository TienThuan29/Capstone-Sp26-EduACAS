using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ExaminationTemplateMapper
{
    public ExaminationTemplateResponse ToExaminationTemplateResponse(ExaminationTemplate template)
    {
        return new ExaminationTemplateResponse
        {
            Id = template.Id,
            ExamName = template.ExamName,
            LecturerId = template.LecturerId,
            Description = template.Description,
            TotalMark = template.TotalMark,
            Problems = template.Problems?.Select(p => new ExamTempProblemResponse
            {
                ProblemId = p.ProblemId,
                Mark = p.Mark
            }).ToList() ?? new List<ExamTempProblemResponse>(),
            IsDeleted = template.IsDeleted,
            CreatedDate = template.CreatedDate,
            UpdatedDate = template.UpdatedDate
        };
    }

    public ExaminationTemplate ToExaminationTemplateModel(ExaminationTemplateRequest request)
    {
        return new Models.ExaminationTemplate
        {
            ExamName = request.ExamName,
            LecturerId = request.LecturerId,
            Description = request.Description ?? string.Empty,
            TotalMark = request.TotalMark,
            Problems = request.Problems?.Select(p => new ExamTempProblem
            {
                ProblemId = p.ProblemId,
                Mark = p.Mark
            }).ToList() ?? new List<ExamTempProblem>()
        };
    }

    public void UpdateExaminationTemplateModel(ExaminationTemplate existing, UpdateExaminationTemplateRequest request)
    {
        existing.ExamName = request.ExamName;
        existing.Description = request.Description ?? string.Empty;
        existing.TotalMark = request.TotalMark;

        if (request.Problems != null)
        {
            existing.Problems = request.Problems.Select(p => new ExamTempProblem
            {
                ProblemId = p.ProblemId,
                Mark = p.Mark
            }).ToList();
        }
    }
}
