'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  CheckCircle,
  XCircle,
  Circle,
  Terminal,
  FileInput,
  FileOutput,
  Copy,
  Check,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Spinner } from 'flowbite-react';
import clsx from 'clsx';
import { useEditorContext } from '@/contexts/EditorContext';
import { useCustomTest } from '@/hooks/coding/useCustomTest';
import { usePublicTests } from '@/hooks/coding/usePublicTests';
import type { TestResultResponse } from '@/types/submission';

// Dynamic import for Monaco Diff Editor
const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-gray-900">
        <Spinner color="info" aria-label="Loading diff editor..." />
      </div>
    ),
  }
);

type ConsoleTab = 'testcases' | 'custom' | 'output';

/** Status from backend TestcaseStatus: SUCCESS, FAIL, TIMEOUT, COMPILE_ERROR, RUNTIME_ERROR, UNKNOWN_ERROR */
function getStatusIcon(status: string | undefined) {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'FAIL':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'TIMEOUT':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'COMPILE_ERROR':
    case 'RUNTIME_ERROR':
    case 'UNKNOWN_ERROR':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-500" />;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function ConsolePanel() {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('testcases');
  const {
    testCases,
    activeTestCaseId,
    setActiveTestCaseId,
    customInput,
    setCustomInput,
    consoleOutput,
    showDiffView,
    setShowDiffView,
    diffContent,
    editorState,
  } = useEditorContext();
  const { runCustomTest, isRunning } = useCustomTest();
  const { runPublicTests, isRunning: isRunningTests, error: testsError, results: testResults, lastMessage: testsLastMessage } = usePublicTests();
  const activeTestCase =
    testCases.find((tc) => tc.id === activeTestCaseId) ?? testCases[0] ?? null;

  const resultByTestcaseId = React.useMemo(() => {
    const map: Record<string, TestResultResponse> = {};
    if (testResults) for (const r of testResults) map[r.testcaseId] = r;
    return map;
  }, [testResults]);

  const handleRunCustomTest = () => {
    runCustomTest();
    setActiveTab('output');
  };

  const handleRunPublicTests = () => {
    runPublicTests();
  };

  const tabs = [
    { id: 'testcases' as const, label: 'Test Cases', icon: Play },
    { id: 'custom' as const, label: 'Custom Input', icon: FileInput },
    { id: 'output' as const, label: 'Output', icon: FileOutput },
  ];

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Main Tabs */}
      <div className="flex items-center justify-between border-b border-gray-700">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ',
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Console Toggle */}
        <div className="flex items-center gap-2 px-3">
          <button
            onClick={() => setActiveTab('output')}
            className={clsx(
              'flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors',
              activeTab === 'output'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Terminal className="h-3.5 w-3.5" />
            Console
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'testcases' && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-gray-800 px-3 py-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                {testCases.map((tc, index) => {
                  const result = resultByTestcaseId[tc.id];
                  const caseNumber = index + 1;
                  return (
                    <button
                      key={tc.id}
                      onClick={() => setActiveTestCaseId(tc.id)}
                      title={tc.id}
                      className={clsx(
                        'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                        activeTestCaseId === tc.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}
                    >
                      {getStatusIcon(result?.status)}
                      <span>Case {caseNumber}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleRunPublicTests}
                disabled={isRunningTests || !testCases?.length}
                className="flex shrink-0 items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isRunningTests ? (
                  <>
                    <Spinner size="sm" color="info" aria-label="Running..." />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run all
                  </>
                )}
              </button>
            </div>
            {testsError && (
              <div className="border-b border-gray-800 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                {testsError}
              </div>
            )}
            {testsLastMessage && !testsError && (
              <div className="border-b border-gray-800 bg-gray-800/50 px-3 py-2 text-sm text-gray-300">
                {testsLastMessage}
              </div>
            )}
            {activeTestCase && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <p className="text-xs font-medium text-gray-500">
                    Test case {testCases.findIndex((tc) => tc.id === activeTestCase.id) + 1} of {testCases.length}
                  </p>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-400">
                        Input
                      </label>
                      <CopyButton text={activeTestCase.inputData ?? ''} />
                    </div>
                    <div className="rounded-md bg-gray-800 p-3">
                      <pre className="font-mono text-sm text-gray-200 whitespace-pre-wrap">
                        {activeTestCase.inputData ?? '(none)'}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-400">
                        Expected Output
                      </label>
                      <CopyButton text={activeTestCase.expectedOutput} />
                    </div>
                    <div className="rounded-md bg-gray-800 p-3">
                      <pre className="font-mono text-sm text-gray-200 whitespace-pre-wrap">
                        {activeTestCase.expectedOutput}
                      </pre>
                    </div>
                  </div>

                  {(() => {
                    const result = resultByTestcaseId[activeTestCase.id];
                    if (!result) return null;
                    const isErrorStatus =
                      result.status === 'COMPILE_ERROR' ||
                      result.status === 'RUNTIME_ERROR' ||
                      result.status === 'UNKNOWN_ERROR' ||
                      result.status === 'TIMEOUT';
                    const displayOutput =
                      result.actualOutput?.trim() ||
                      (result.status === 'COMPILE_ERROR'
                        ? 'Compilation failed. Check your code for syntax errors.'
                        : '(no output)');
                    return (
                      <>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-400">
                              Your Output
                            </label>
                            <CopyButton text={result.actualOutput} />
                          </div>
                          <div
                            className={clsx(
                              'rounded-md p-3',
                              result.status === 'SUCCESS' &&
                                'bg-green-900/20 border border-green-700/50',
                              result.status === 'FAIL' &&
                                'bg-red-900/20 border border-red-700/50',
                              isErrorStatus &&
                                'bg-amber-900/20 border border-amber-700/50'
                            )}
                          >
                            <pre
                              className={clsx(
                                'font-mono text-sm whitespace-pre-wrap',
                                result.status === 'SUCCESS' && 'text-green-300',
                                result.status === 'FAIL' && 'text-red-300',
                                isErrorStatus && 'text-amber-300'
                              )}
                            >
                              {displayOutput}
                            </pre>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-gray-400">
                            {getStatusIcon(result.status)}
                            {result.status.replace(/_/g, ' ')}
                          </span>
                          {result.executionTimeMs >= 0 && (
                            <span className="text-gray-500">
                              Runtime: {result.executionTimeMs}ms
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="flex h-full flex-col p-4">
            <label className="mb-2 text-sm font-medium text-gray-300">
              Custom Test Input
            </label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter your custom test input here..."
              className="min-h-[120px] flex-1 resize-none rounded-md border border-gray-700 bg-gray-800 p-3 font-mono text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Enter custom input to test your code. Stdout and stderr will appear in the Output tab.
              </p>
              <button
                type="button"
                onClick={handleRunCustomTest}
                disabled={isRunning}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <Spinner size="sm" color="info" aria-label="Running..." />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="flex h-full flex-col p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Console Output</span>
              {consoleOutput && <CopyButton text={consoleOutput} />}
            </div>
            <div className="flex-1 overflow-y-auto rounded-md border border-gray-700 bg-black p-3">
              {consoleOutput ? (
                <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
                  {consoleOutput}
                </pre>
              ) : (
                <span className="text-sm text-gray-500">
                  Run your code to see output here...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
