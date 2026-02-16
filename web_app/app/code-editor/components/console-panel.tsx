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
  X,
} from 'lucide-react';
import { Spinner } from 'flowbite-react';
import clsx from 'clsx';
import { useEditorContext } from '@/contexts/EditorContext';
import { useCustomTest } from '@/hooks/coding/useCustomTest';
import { TestCase } from '@/types/examination';

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

// function getStatusIcon(status: TestCaseStatus) {
//   switch (status) {
//     case 'pass':
//       return <CheckCircle className="h-4 w-4 text-green-500" />;
//     case 'fail':
//       return <XCircle className="h-4 w-4 text-red-500" />;
//     case 'error':
//       return <XCircle className="h-4 w-4 text-orange-500" />;
//     default:
//       return <Circle className="h-4 w-4 text-gray-500" />;
//   }
// }

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
  const activeTestCase = testCases.find((tc) => tc.id === activeTestCaseId);

  const handleRunCustomTest = () => {
    runCustomTest();
    setActiveTab('output');
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
            {/* Test Case Tabs */}
            {/* <div className="flex items-center gap-1 border-b border-gray-800 px-3 py-2">
              {testCases.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => setActiveTestCaseId(tc.id)}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                    activeTestCaseId === tc.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  )}
                >
                  {getStatusIcon(tc.status)}
                  <span>Case {tc.id}</span>
                </button>
              ))}
            </div> */}

            {/* Test Case Details */}
            {activeTestCase && (
              <div className="flex-1 overflow-y-auto p-4">
                {/* Show Diff View if available and test failed */}
                {/* {showDiffView && diffContent && activeTestCase.status === 'fail' ? (
                  <div className="h-full">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white">
                        Output Comparison
                      </h4>
                      <button
                        onClick={() => setShowDiffView(false)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="h-[200px] overflow-hidden rounded-md border border-gray-700">
                      <MonacoDiffEditor
                        height="100%"
                        original={diffContent.expected}
                        modified={diffContent.actual}
                        theme={editorState.theme}
                        options={{
                          readOnly: true,
                          renderSideBySide: true,
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'off',
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          diffWordWrap: 'on',
                        }}
                        originalLanguage="text"
                        modifiedLanguage="text"
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Expected Output</span>
                      <span>Your Output</span>
                    </div>
                  </div>
                ) : ( */}
                  <div className="space-y-4">
                    {/* Input */}
                    {/* <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-400">
                          Input
                        </label>
                        <CopyButton text={activeTestCase.input} />
                      </div>
                      <div className="rounded-md bg-gray-800 p-3">
                        <pre className="font-mono text-sm text-gray-200 whitespace-pre-wrap">
                          {activeTestCase.input}
                        </pre>
                      </div>
                    </div> */}

                    {/* Expected Output */}
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

                    {/* Actual Output (if tested) */}
                    {/* {activeTestCase.actualOutput !== undefined && (
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-400">
                            Your Output
                          </label>
                          <div className="flex items-center gap-2">
                            {activeTestCase.status === 'fail' && diffContent && (
                              <button
                                onClick={() => setShowDiffView(true)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                View Diff
                              </button>
                            )}
                            <CopyButton text={activeTestCase.actualOutput} />
                          </div>
                        </div> */}
                        {/* <div
                          className={clsx(
                            'rounded-md p-3',
                            activeTestCase.status === 'pass'
                              ? 'bg-green-900/20 border border-green-700/50'
                              : 'bg-red-900/20 border border-red-700/50'
                          )}
                        >
                          <pre
                            className={clsx(
                              'font-mono text-sm whitespace-pre-wrap',
                              activeTestCase.status === 'pass'
                                ? 'text-green-300'
                                : 'text-red-300'
                            )}
                          >
                            {activeTestCase.actualOutput}
                          </pre>
                        </div> */}
                      </div>
                    {/* )} */}

                    {/* Execution Stats */}
                    {/* {activeTestCase.executionTime !== undefined && (
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>
                          Runtime: {activeTestCase.executionTime.toFixed(2)}ms
                        </span>
                        {activeTestCase.memoryUsed !== undefined && (
                          <span>
                            Memory: {activeTestCase.memoryUsed.toFixed(2)}MB
                          </span>
                        )}
                      </div>
                    )} */}
                  </div>
              // </div>
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
