'use client';

import { useState, useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import { useEditorContext } from '@/contexts/EditorContext';
import type { CompilationResult, ResultLine, CustomTestcaseRequest, CompileRequest } from '@/types/submission';

function formatLines(lines: ResultLine[] | undefined): string {
  if (!lines?.length) return '';
  return lines.map((l) => l.text).join('');
}

function formatExecResult(result: CompilationResult): string {
  const out = formatLines(result.stdout);
  const err = formatLines(result.stderr);
  const parts: string[] = [];
  if (out) parts.push(out);
  if (err) parts.push(err);
  return parts.join(err && out ? '\n' : '');
}

export function useCustomTest() {
  const axiosInstance = useAxios();
  const { editorState, selectedCompiler, customInput, setConsoleOutput } =
    useEditorContext();

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCustomTest = useCallback(async () => {
    if (!selectedCompiler) {
      setError('Please select a compiler (language) first.');
      setConsoleOutput('Error: Please select a compiler (language) first.');
      return;
    }

    const lang = editorState.language?.id;
    if (!lang) {
      setError('Language is required.');
      setConsoleOutput('Error: Language is required.');
      return;
    }

    setIsRunning(true);
    setError(null);
    setConsoleOutput('Running with custom input...\n');

    // Normalize line endings to \n so code-runner receives correct source (single string with \n between lines)
    const normalizedSource = (editorState.code ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    const normalizedStdin = (customInput ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const compileRequest: CompileRequest = {
      source: normalizedSource,
      options: {
        compilerOptions: {},
        executeParameters: { stdin: normalizedStdin },
        filters: { execute: true },
      },
      lang,
    };

    const body: CustomTestcaseRequest = {
      compilerId: selectedCompiler.id,
      compileRequest,
      lang,
    };

    try {
      const response = await axiosInstance.post<{
        success: boolean;
        dataResponse?: CompilationResult;
        message?: string;
      }>(Api.Submission.EXECUTE_CUSTOM_TESTCASE, body);

      const data = response.data?.dataResponse;
      if (!data) {
        const msg = (response.data as { message?: string })?.message ?? 'No response data';
        setConsoleOutput(`Error: ${msg}`);
        setError(msg);
        return;
      }

      // Code-runner puts execution stdout/stderr in execResult when it runs with stdin
      const resultToShow = data.execResult ?? data;
      const text = formatExecResult(resultToShow);
      const timedOut = data.timedOut || resultToShow.timedOut;
      const code = resultToShow.code ?? data.code;
      if (timedOut) {
        setConsoleOutput((text ? text + '\n\n' : '') + '(Timed out)');
      } else if (code !== 0 && !text) {
        setConsoleOutput(`Exit code: ${code}`);
      } else {
        setConsoleOutput(text || '(No output)');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Request failed';
      setError(message ?? 'Request failed');
      setConsoleOutput(`Error: ${message ?? 'Request failed'}`);
    } finally {
      setIsRunning(false);
    }
  }, [
    axiosInstance,
    editorState.code,
    editorState.language?.id,
    selectedCompiler,
    customInput,
    setConsoleOutput,
  ]);

  return { runCustomTest, isRunning, error };
}
