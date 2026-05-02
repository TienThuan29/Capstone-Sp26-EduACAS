using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ProblemMapper
{
    public ProblemResponse ToProblemResponse(Problem problem, string fileUrl, IEnumerable<Models.TestCase> testCases)
    {
        return new ProblemResponse
        {
            Id = problem.Id,
            LecturerId = problem.LecturerId,
            Title = problem.Title,
            Content = problem.Content,
            FileName = problem.FileName,
            FileUrl = fileUrl,
            Difficulty = problem.Difficulty,
            CodeTemplates = problem.CodeTemplates ?? new Dictionary<string, string>(),
            TestCases = testCases
                .Where(tc => !tc.IsDeleted)
                .Select(ToTestCaseResponse)
                .ToList(),
            Tags = problem.Tags?.ToList() ?? new List<string>(),
            CreatedDate = problem.CreatedDate,
            UpdatedDate = problem.UpdatedDate
        };
    }

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
            CodeTemplates = problem.CodeTemplates ?? new Dictionary<string, string>(),
            TestCases = problem.TestCases
                .Where(tc => !tc.IsDeleted)
                .Select(ToTestCaseResponse)
                .ToList(),
            Tags = problem.Tags?.ToList() ?? new List<string>(),
            CreatedDate = problem.CreatedDate,
            UpdatedDate = problem.UpdatedDate
        };
    }

    public TestCaseResponse ToTestCaseResponse(Models.TestCase testCase)
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
            IsTokenComparision = testCase.IsTokenComparision,
            IsNotOrderedComparision = testCase.IsNotOrderedComparision
        };
    }

    public Web.Requests.TestCase ToTestCaseRequest(Models.TestCase tc)
    {
        return new Web.Requests.TestCase
        {
            Id = tc.Id,
            ProblemId = tc.ProblemId,
            InputData = tc.InputData,
            ExpectedOutput = tc.ExpectedOutput,
            IsPublic = tc.IsPublic,
            IsCaseInsensitive = tc.IsCaseInsensitive,
            IsFloatingPoint = tc.IsFloatingPoint,
            FloatingPointTolerance = tc.FloatingPointTolerance,
            DecimalPlaces = tc.DecimalPlaces,
            IsTokenComparision = tc.IsTokenComparision,
            IsNotOrderedComparision = tc.IsNotOrderedComparision
        };
    }

}