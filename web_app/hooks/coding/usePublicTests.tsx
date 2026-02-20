'use client';

import { useState, useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import { useEditorContext } from '@/contexts/EditorContext';
import type {
  PublicTestcasesRequest,
  RumBatchRequest,
  RunBatchTestCase,
  TestResultResponse,
} from '@/types/submission';
import type { TestCase } from '@/types/examination';

function mapToRunBatchTestCase(tc: TestCase, problemId?: string): RunBatchTestCase {
  return {
    id: tc.id,
    problemId,
    inputData: tc.inputData,
    expectedOutput: tc.expectedOutput,
    isPublic: tc.isPublic,
    isCaseInsensitive: tc.isCaseInsensitive,
    isFloatingPoint: false,
    floatingPointTolerance: null,
    decimalPlaces: null,
    isTokenComparision: false,
    isNotOrderedComparision: null,
  };
}

export function usePublicTests() {
  const axiosInstance = useAxios();
  const { editorState, selectedCompiler, testCases, problem, setConsoleOutput } = useEditorContext();

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TestResultResponse[] | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const runPublicTests = useCallback(async () => {
    if (!selectedCompiler) {
      setError('Please select a compiler (language) first.');
      setResults(null);
      return;
    }

    const lang = editorState.language?.id;
    if (!lang) {
      setError('Language is required.');
      setResults(null);
      return;
    }

    if (!testCases?.length) {
      setError('No test cases to run.');
      setResults(null);
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);
    setLastMessage(null);

    const normalizedSource = (editorState.code ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const runBatchTestCases: RunBatchTestCase[] = testCases.map((tc) =>
      mapToRunBatchTestCase(tc, problem?.id)
    );
    const stdinList = testCases.map((tc) =>
      (tc.inputData ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    );

    const runBatchRequest: RumBatchRequest = {
      source: normalizedSource,
      options: {
        compilerOptions: {},
        filters: { execute: true },
      },
      lang,
      stdinList,
      testCases: runBatchTestCases,
    };

    const body: PublicTestcasesRequest = {
      compilerId: selectedCompiler.id,
      lang,
      runBatchRequest,
    };

    try {
      const response = await axiosInstance.post<{
        success: boolean;
        dataResponse?: TestResultResponse[];
        message?: string;
        error?: string;
      }>(Api.Submission.EXECUTE_PUBLIC_TESTCASES, body);

      const res = response.data as {
        success?: boolean;
        dataResponse?: TestResultResponse[];
        data?: TestResultResponse[];
        message?: string;
        error?: string;
      };

      const data = res?.dataResponse ?? res?.data;
      if (!res?.success || !Array.isArray(data)) {
        const msg =
          res?.message ?? res?.error ?? 'No response data';
        setError(msg);
        setResults(null);
        setConsoleOutput(`Error: ${msg}`);
        return;
      }

      setResults(data);

      const apiMessage = res?.message ?? 'Public testcases executed successfully.';
      setLastMessage(apiMessage);
      const hasCompileError = data.some((r) => r.status === 'COMPILE_ERROR');
      const compileDetail =
        hasCompileError && data[0]?.actualOutput?.trim()
          ? `\n\n${data[0].actualOutput.trim()}`
          : '';
      setConsoleOutput(`${apiMessage}${compileDetail}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
              ?.message ??
            (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
            ? err.message
            : 'Request failed';
      setError(message ?? 'Request failed');
      setResults(null);
      setConsoleOutput(`Error: ${message ?? 'Request failed'}`);
    } finally {
      setIsRunning(false);
    }
  }, [
    axiosInstance,
    editorState.code,
    editorState.language?.id,
    selectedCompiler,
    testCases,
    problem?.id,
    setConsoleOutput,
  ]);

  return { runPublicTests, isRunning, error, results, lastMessage };
}
