using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public static class AcademicWarningMapper
{
    public static AcademicWarningResponse ToResponse(AcademicWarning warning)
    {
        return new AcademicWarningResponse
        {
            Id = warning.Id,
            ClassroomId = warning.ClassroomId,
            StudentId = warning.StudentId,
            WarningLevel = warning.WarningLevel,
            TriggerType = warning.TriggerType.ToString(),
            SentDate = warning.SentDate,
            IsRead = warning.IsRead,
            CreatedDate = warning.CreatedDate,
            UpdatedDate = warning.UpdatedDate,
            InvolvedExams = warning.InvolvedExams != null
                ? new InvolvedExamsInfoDto
                {
                    ExamScores = warning.InvolvedExams.ExamScores,
                    AverageScore = warning.InvolvedExams.AverageScore
                }
                : null,
            LlmAnalysis = warning.LlmAnalysis?.ToDictionary(
                kvp => kvp.Key,
                kvp => new AnalysisEntryDto
                {
                    SubmissionId = kvp.Value.SubmissionId,
                    Analysis = kvp.Value.Analysis,
                    Recomendation = kvp.Value.Recomendation
                }
            ) ?? new Dictionary<string, AnalysisEntryDto>(),
            LecturerAnalysis = warning.LecturerAnalysis?.ToDictionary(
                kvp => kvp.Key,
                kvp => new AnalysisEntryDto
                {
                    SubmissionId = kvp.Value.SubmissionId,
                    Analysis = kvp.Value.Analysis,
                    Recomendation = kvp.Value.Recomendation
                }
            ) ?? new Dictionary<string, AnalysisEntryDto>()
        };
    }
}
