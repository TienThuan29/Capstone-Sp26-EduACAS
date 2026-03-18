using AcasService.Application.ResponseDTOs;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Submission;

public interface IExecutionCommand
{

    Task<CompilationResult> ExecuteCustomTestcaseAsync(string compilerId, CompileRequest compileRequest, string lang);

    Task<List<TestResultResponse>> ExecuteTestcasesAsync(string compilerId, RumBatchRequest runBatchRequest, string lang);
}

public class ExecutionCommand : IExecutionCommand
{
      private readonly ITestcaseEvaluator _testcaseEvaluator;

      private readonly ILogger<ExecutionCommand> _logger;

      public ExecutionCommand(ITestcaseEvaluator testcaseEvaluator, ILogger<ExecutionCommand> logger)
      {
            _testcaseEvaluator = testcaseEvaluator;
            _logger = logger;
      }

      public async Task<CompilationResult> ExecuteCustomTestcaseAsync(string compilerId, CompileRequest compileRequest, string lang)
      {
            var result = await _testcaseEvaluator.ExecuteCustomTestcaseAsync(compilerId, compileRequest, lang);
            return result;
      }

      public async Task<List<TestResultResponse>> ExecuteTestcasesAsync(string compilerId, RumBatchRequest runBatchRequest, string lang)
      {
            var result = await _testcaseEvaluator.ExecuteTestcasesAsync(compilerId, runBatchRequest, lang);
            return result;
      }
}