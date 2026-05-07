using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ErrorGroupMapper
{

    public ErrorGroupSummaryResponse ToSummaryResponse(ErrorGroup errorGroup)
    {
        return new ErrorGroupSummaryResponse
        {
            Id = errorGroup.Id,
            ProblemId = errorGroup.ProblemId,
            ExamId = errorGroup.ExamId,
            ErrorSignature = errorGroup.ErrorSignature,
            JPlagStatus = errorGroup.JPlagStatus.ToString(),
            SubmissionIds = errorGroup.SubmissionIds ?? new(),
            JPlagResults = errorGroup.JPlagResults?
                .Select(m => new JPlagMatchSummaryResponse
                {
                    Submission1Id = m.Submission1Id,
                    Submission2Id = m.Submission2Id,
                    SimilarityScore = m.SimilarityScore
                })
                .ToList() ?? new(),
            CreatedDate = errorGroup.CreatedDate
        };
    }


    public ErrorGroupDetailResponse ToDetailResponse(ErrorGroup errorGroup)
    {
        var response = new ErrorGroupDetailResponse
        {
            Id = errorGroup.Id,
            ProblemId = errorGroup.ProblemId,
            ExamId = errorGroup.ExamId,
            ErrorSignature = errorGroup.ErrorSignature,
            JPlagStatus = errorGroup.JPlagStatus.ToString(),
            SubmissionIds = errorGroup.SubmissionIds ?? new(),
            CreatedDate = errorGroup.CreatedDate
        };

        response.JPlagResults = errorGroup.JPlagResults?
            .Select(m => new JPlagMatchDetailGroupResponse
            {
                Submission1Id = m.Submission1Id,
                Submission2Id = m.Submission2Id,
                SimilarityScore = m.SimilarityScore,
                Details = m.Details?
                    .Select(d => new MatchLineDetailResponse
                    {
                        StartLine1 = d.StartLine1,
                        EndLine1 = d.EndLine1,
                        StartLine2 = d.StartLine2,
                        EndLine2 = d.EndLine2,
                        Tokens = d.Tokens
                    }).ToList() ?? new()
            })
            .ToList() ?? new();

        return response;
    }
}
