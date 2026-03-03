using System;
using System.Collections.Generic;
using System.Linq;
using AcasService.Application.CodeRunner;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Models;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Submission;

public interface ITestcaseEvaluator
{
    Task<CompilationResult> ExecuteCustomTestcaseAsync(
        string compilerId,
        CompileRequest compileRequest,
        string lang);
    
    Task<List<TestResultResponse>> ExecuteTestcasesAsync(
        string compilerId,
        RumBatchRequest runBatchRequest,
        string lang);
}

public class TestcaseEvaluator : ITestcaseEvaluator
{
    private readonly ICompilationApi _compilationApi;
    private readonly IResultComparator _resultComparator;
    private readonly TestResultMapper _testResultMapper;

    public TestcaseEvaluator(ICompilationApi compilationApi, IResultComparator resultComparator, TestResultMapper testResultMapper)
    {
        _compilationApi = compilationApi;
        _resultComparator = resultComparator;
        _testResultMapper = testResultMapper;
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

        if (result.ExecResult != null)
        {
            result.Stdout = result.ExecResult.Stdout;
            result.Stderr = result.ExecResult.Stderr;
            result.Code = result.ExecResult.Code;
            result.TimedOut = result.ExecResult.TimedOut;
        }

        return result;
    }

    public async Task<List<TestResultResponse>> ExecuteTestcasesAsync(
        string compilerId,
        RumBatchRequest runBatchRequest,
        string lang)
    {
        var runBatchResponse = await _compilationApi.RunBatchAsync(compilerId, runBatchRequest, lang);
        var results = new List<TestResultResponse>();
        bool compilationFailed = IsCompilationFailed(runBatchResponse);

        if (compilationFailed)
        {
            var compileErrorText = GetCompileErrorText(runBatchResponse);
            for (int i = 0; i < runBatchRequest.TestCases.Count; i++)
            {
                var testCase = runBatchRequest.TestCases[i];
                results.Add(new TestResultResponse
                {
                    Id = Guid.NewGuid().ToString(),
                    TestcaseId = testCase.Id,
                    Input = i < runBatchRequest.StdinList.Count
                        ? runBatchRequest.StdinList[i]
                        : testCase.InputData,
                    ActualOutput = compileErrorText,
                    ExpectedOutput = testCase.ExpectedOutput,
                    ExecutionTimeMs = runBatchResponse.ExecTime ?? 0,
                    Status = TestcaseStatus.COMPILE_ERROR.ToString(),
                    CreatedDate = DateTime.UtcNow
                });
            }
            return results;
        }

        if (runBatchResponse.ExecResults!.Count == runBatchRequest.TestCases.Count)
        {
            for (int i = 0; i < runBatchRequest.TestCases.Count; i++)
            {
                results.Add(MapExecResultToTestResult(
                    runBatchResponse.ExecResults[i],
                    runBatchRequest.TestCases[i]));
            }
            return results;
        }

        throw new Exception("Failed to execute public testcases");
    }


    private bool IsCompilationFailed(RunBatchResponse runBatchResponse)
    {
        // Build failed: treat as COMPILE_ERROR even if code-runner returned ExecResults (e.g. failed run entries)
        if (runBatchResponse.BuildResult != null && runBatchResponse.BuildResult.Code != 0)
            return true;

        // No exec results: treat as compile failure (build may have failed or no runs)
        if (runBatchResponse.ExecResults == null || runBatchResponse.ExecResults.Count == 0)
        {
            if (runBatchResponse.BuildResult != null)
                return runBatchResponse.BuildResult.Stderr != null && runBatchResponse.BuildResult.Stderr.Count > 0;
            return true;
        }

        // ExecResults present and build did not fail: use run results (RUNTIME_ERROR, FAIL, etc.), not COMPILE_ERROR
        return false;
    }

    private static string GetCompileErrorText(RunBatchResponse runBatchResponse)
    {
        var stderr = runBatchResponse.BuildResult?.Stderr ?? runBatchResponse.Stderr;
        if (stderr == null || stderr.Count == 0)
        {
            var first = runBatchResponse.ExecResults?.FirstOrDefault();
            var run = first?.ExecResult ?? first;
            stderr = run?.Stderr;
        }
        if (stderr == null || stderr.Count == 0)
            return "Compilation failed.";
        return string.Join("", stderr.Select(l => l?.Text ?? ""));
    }

    // private bool HasOutput(CompilationResult r)
    // {
    //     if (r.Stdout != null && r.Stdout.Count > 0) return true;
    //     if (r.ExecResult?.Stdout != null && r.ExecResult.Stdout.Count > 0) return true;
    //     return false;
    // }

    private TestResultResponse MapExecResultToTestResult(
        CompilationResult execResult,
        Web.Requests.TestCase testCase)
    {
        // Code-runner may put the actual run output in execResult.ExecResult (nested) or on the batch response root
        var run = execResult.ExecResult ?? execResult;

        var stdout = run.Stdout ?? new List<ResultLine>();
        string actualOutput = string.Join("\n", stdout.Select(line => line?.Text ?? string.Empty));

        var stderr = run.Stderr ?? new List<ResultLine>();
        bool hasStderr = stderr.Count > 0;
        int code = run.Code;
        bool timedOut = run.TimedOut;
        int execTimeMs = run.ExecTime ?? execResult.ExecTime ?? 0;

        TestcaseStatus status;
        if (timedOut)
        {
            status = TestcaseStatus.TIMEOUT;
        }
        else if (code != 0 || hasStderr)
        {
            status = TestcaseStatus.RUNTIME_ERROR;
        }
        else
        {
            var testcaseOption = new TestcaseOption
            {
                IsCaseInsensitive = testCase.IsCaseInsensitive,
                IsFloatingPoint = testCase.IsFloatingPoint,
                FloatingPointTolerance = testCase.FloatingPointTolerance,
                DecimalPlaces = testCase.DecimalPlaces,
                IsTokenComparision = testCase.IsTokenComparision,
                IsNotOrderedComparision = testCase.IsNotOrderedComparision
            };
            status = _resultComparator.Compare(testCase.ExpectedOutput, actualOutput, testcaseOption);
        }

        return _testResultMapper.ToTestResultResponse(new TestResult
        {
            Id = Guid.NewGuid().ToString(),
            TestcaseId = testCase.Id,
            Input = testCase.InputData,
            ActualOutput = actualOutput,
            ExpectedOutput = testCase.ExpectedOutput,
            ExecutionTimeMs = execTimeMs,
            Status = status,
            CreatedDate = DateTime.UtcNow
        });
    }
}