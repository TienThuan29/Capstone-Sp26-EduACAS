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
            LecturerId = problem.LecturerId,
            Title = problem.Title,
            Content = problem.Content,
            FileName = problem.FileName,
            Difficulty = problem.Difficulty,
            CodeTemplate = problem.CodeTemplates != null && problem.CodeTemplates.TryGetValue("default", out var template) ? template : (problem.CodeTemplates?.Values.FirstOrDefault() ?? string.Empty),
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
            ProblemId = testCase.ProblemId,
            InputData = testCase.InputData,
            ExpectedOutput = testCase.ExpectedOutput,
            IsPublic = testCase.IsPublic,
            IsCaseInsensitive = testCase.IsCaseInsensitive,
            IsFloatingPoint = testCase.IsFloatingPoint,
            FloatingPointTolerance = testCase.FloatingPointTolerance,
            DecimalPlaces = testCase.DecimalPlaces,
            IsTokenComparision = testCase.IsTokenComparision
        };
    }

}