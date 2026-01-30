using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ProblemMapper
{
    public ProblemResponse ToProblemResponse(Problem problem)
    {
        return new ProblemResponse
        {
            Id = problem.Id,
            ExamId = problem.ExamId,
            LecturerId = problem.LecturerId,
            Title = problem.Title,
            Content = problem.Content,
            FileName = problem.FileName,
            Mark = problem.Mark,
            Difficulty = problem.Difficulty,
            CodeTemplate = problem.CodeTemplate,
            TestCases = problem.TestCases
                .Where(tc => !tc.IsDeleted)
                .Select(ToTestCaseResponse)
                .ToList(),
            CreatedDate = problem.CreatedDate,
            UpdatedDate = problem.UpdatedDate
        };
    }

    public TestCaseResponse ToTestCaseResponse(TestCase testCase)
    {
        return new TestCaseResponse
        {
            Id = testCase.Id,
            InputData = testCase.InputData,
            ExpectedOutput = testCase.ExpectedOutput,
            IsPublic = testCase.IsPublic,
            IsCaseInsensitive = testCase.IsCaseInsensitive,
            IsRemovedSpace = testCase.IsRemovedSpace
        };
    }

}