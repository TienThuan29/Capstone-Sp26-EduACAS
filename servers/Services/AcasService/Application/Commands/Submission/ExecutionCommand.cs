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

        // Check if compilation failed - all test cases fail with COMPILE_ERROR
        if (runBatchResponse.BuildResult != null)
        {
            if (runBatchResponse.Code != 0 || runBatchResponse.BuildResult.Stderr.Count > 0)
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
        }

        // Process each execution result
        if (runBatchResponse.ExecResults == null || runBatchResponse.ExecResults.Count == 0)
        {
            throw new InvalidOperationException("No execution results returned from code-runner service");
        }

        if (runBatchResponse.ExecResults.Count != runBatchRequest.TestCases.Count)
        {
            throw new InvalidOperationException(
                $"Mismatch: {runBatchResponse.ExecResults.Count} execution results but {runBatchRequest.TestCases.Count} test cases");
        }

        // Process all test cases
        for (int i = 0; i < runBatchRequest.TestCases.Count; i++)
        {
            var execResult = runBatchResponse.ExecResults[i];
            var testCase = runBatchRequest.TestCases[i];

            // Extract actual output from stdout
            string actualOutput = string.Join("\n", execResult.Stdout.Select(line => line.Text));

            // Determine status based on execution result
            TestcaseStatus status;
            if (execResult.TimedOut)
            {
                status = TestcaseStatus.TIMEOUT;
            }
            else if (execResult.Code != 0 || (execResult.Stderr != null && execResult.Stderr.Count > 0))
            {
                status = TestcaseStatus.RUNTIME_ERROR;
            }
            else
            {
                // Compilation and execution succeeded - compare outputs
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

            results.Add(_testResultMapper.ToTestResultResponse(new TestResult
            {
                Id = Guid.NewGuid().ToString(),
                TestcaseId = testCase.Id,
                Input = testCase.InputData,
                ActualOutput = actualOutput,
                ExpectedOutput = testCase.ExpectedOutput,
                ExecutionTimeMs = execResult.ExecTime ?? 0,
                Status = status,
                CreatedDate = DateTime.UtcNow
            }));
        }

        return results;
    }
}