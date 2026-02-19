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

public interface IExecutionCommand
{
    Task<CompilationResult> ExecuteCustomTestcaseAsync(
        string compilerId,
        CompileRequest compileRequest,
        string lang);
    
    Task<List<TestResultResponse>> ExecutePublicTestcasesAsync(
        string compilerId,
        RumBatchRequest runBatchRequest,
        string lang);
}

public class ExecutionCommand : IExecutionCommand
{
    private readonly ICompilationApi _compilationApi;
    private readonly IResultComparator _resultComparator;
    private readonly TestResultMapper _testResultMapper;

    public ExecutionCommand(ICompilationApi compilationApi, IResultComparator resultComparator, TestResultMapper testResultMapper)
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

    public async Task<List<TestResultResponse>> ExecutePublicTestcasesAsync(
        string compilerId,
        RumBatchRequest runBatchRequest,
        string lang)
    {
        var runBatchResponse = await _compilationApi.RunBatchAsync(compilerId, runBatchRequest, lang);
        var results = new List<TestResultResponse>();
        bool compilationFailed = IsCompilationFailed(runBatchResponse);

        if (compilationFailed)
        {
            // Return COMPILE_ERROR for all test cases
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
                    ActualOutput = "",
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

        // Fallback: code-runner returned a different number of results (e.g. 1 per batch).
        // Run once per test case, get one result per test case.
        // for (int i = 0; i < runBatchRequest.TestCases.Count; i++)
        // {
        //     var testCase = runBatchRequest.TestCases[i];
        //     var singleRequest = new RumBatchRequest
        //     {
        //         Source = runBatchRequest.Source,
        //         Options = runBatchRequest.Options,
        //         Lang = runBatchRequest.Lang,
        //         StdinList = new List<string> { testCase.InputData },
        //         TestCases = new List<Web.Requests.TestCase> { testCase }
        //     };
        //     var singleResponse = await _compilationApi.RunBatchAsync(compilerId, singleRequest, lang);

        //     if (singleResponse.ExecResults == null || singleResponse.ExecResults.Count == 0)
        //     {
        //         // Compilation or run failed for this test case
        //         results.Add(new TestResultResponse
        //         {
        //             Id = Guid.NewGuid().ToString(),
        //             TestcaseId = testCase.Id,
        //             Input = testCase.InputData,
        //             ActualOutput = "",
        //             ExpectedOutput = testCase.ExpectedOutput,
        //             ExecutionTimeMs = singleResponse.ExecTime ?? 0,
        //             Status = TestcaseStatus.COMPILE_ERROR.ToString(),
        //             CreatedDate = DateTime.UtcNow
        //         });
        //         continue;
        //     }

        //     // For single-run batch, code-runner often puts stdout/code at response root, not in execResults[0].
        //     var singleExec = singleResponse.ExecResults[0];
        //     var effectiveResult = HasOutput(singleExec) ? singleExec : (CompilationResult)singleResponse;
        //     results.Add(MapExecResultToTestResult(effectiveResult, testCase));
        // }

        throw new Exception("Failed to execute public testcases");
    }


    private bool IsCompilationFailed(RunBatchResponse runBatchResponse)
    {
        if (runBatchResponse.ExecResults != null && runBatchResponse.ExecResults.Count > 0)
            return false;

        if (runBatchResponse.BuildResult != null)
        {
            return runBatchResponse.BuildResult.Code != 0 ||
                   (runBatchResponse.BuildResult.Stderr != null && runBatchResponse.BuildResult.Stderr.Count > 0);
        }

        return true;
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