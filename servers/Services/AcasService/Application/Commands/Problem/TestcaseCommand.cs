using AcasService.Application.ResponseDTOs;
using ProblemModel = AcasService.Models.Problem;

namespace AcasService.Application.Commands.Problem;

public interface ITestcaseCommand
{
    Task<List<TestCaseResponse>> GenerateFromStringAsync(string problemContent, int numberOfTestcases);
}

public class TestcaseCommand : ITestcaseCommand
{
    private readonly ITestcaseGenerator _testcaseGenerator;

    public TestcaseCommand(ITestcaseGenerator testcaseGenerator)
    {
        _testcaseGenerator = testcaseGenerator;
    }

    public async Task<List<TestCaseResponse>> GenerateFromStringAsync(string problemContent, int numberOfTestcases)
    {
        if (string.IsNullOrWhiteSpace(problemContent))
        {
            throw new ArgumentException("Problem content is required", nameof(problemContent));
        }

        if (numberOfTestcases <= 0)
        {
            numberOfTestcases = 4;
        }

        var problem = new ProblemModel
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Gemini Test Problem",
            Content = problemContent
        };

        return await _testcaseGenerator.GenerateTestcasesAsync(problem, numberOfTestcases);
    }
}