using AcasService.Application.CodeRunner;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Submission;

public interface IExecutionCommand
{
    Task<CompilationResult> ExecuteCustomTestcaseAsync(
        string compilerId,
        CompileRequest compileRequest,
        string lang);
}

public class ExecutionCommand : IExecutionCommand
{
    private readonly ICompilationApi _compilationApi;

    public ExecutionCommand(ICompilationApi compilationApi)
    {
        _compilationApi = compilationApi;
    }

    public async Task<CompilationResult> ExecuteCustomTestcaseAsync(
        string compilerId,
        CompileRequest compileRequest,
        string lang)
    {
        compileRequest.Options ??= new CompileOptions();
        compileRequest.Options.Filters ??= new CompileFilters();
        compileRequest.Options.Filters.Execute = true;

        var result = await _compilationApi.CompileAsync(compilerId, compileRequest, lang);

        // Code-runner puts execution stdout/stderr in execResult; promote to top level so API response includes run output
        if (result.ExecResult != null)
        {
            result.Stdout = result.ExecResult.Stdout;
            result.Stderr = result.ExecResult.Stderr;
            result.Code = result.ExecResult.Code;
            result.TimedOut = result.ExecResult.TimedOut;
        }

        return result;
    }
}