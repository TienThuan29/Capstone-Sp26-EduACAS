'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useEditorContext } from '@/contexts/EditorContext';

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
      return null;
  }
}

export function ActionFooter() {
  const {
    isExamMode,
    testCases,
    practiceTestResults,
  } = useEditorContext();

  const passedCount = practiceTestResults
    ? practiceTestResults.passedTestCases
    : testCases.filter((tc) => 'status' in tc && (tc as { status: string }).status === 'pass').length;
  const totalCount = practiceTestResults
    ? practiceTestResults.totalTestCases
    : testCases.length;
  const hasResults = practiceTestResults != null || testCases.some((tc) => 'status' in tc && (tc as { status: string }).status !== 'untested');

  // Exam mode: show summary only
  if (isExamMode) {
    return (
      <div className="flex items-center justify-between border-t border-gray-700 bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded bg-amber-600/20 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-600/50">
            Exam Mode
          </span>
          {hasResults && (
            <span className="text-sm text-gray-400">
              Test Cases:{' '}
              <span className={clsx(passedCount === totalCount ? 'text-green-400' : 'text-yellow-400')}>
                {passedCount}/{totalCount} passed
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          Submit via exam timer or forced submit
        </div>
      </div>
    );
  }

  // Practice mode: show grading results from submit-and-grade
  return (
    <div className="flex items-center justify-between border-t border-gray-700 bg-gray-900 px-4 py-3">
      <div className="flex items-center gap-4">
        {practiceTestResults && (
          <div className="flex items-center gap-2">
            {getStatusIcon(practiceTestResults.status)}
            <span
              className={clsx(
                'text-sm font-medium',
                practiceTestResults.status === 'GRADED' ? 'text-green-400' : 'text-red-400'
              )}
            >
              {practiceTestResults.finalScore}%
            </span>
            <span className="text-xs text-gray-500">
              ({practiceTestResults.passedTestCases}/{practiceTestResults.totalTestCases} passed)
            </span>
          </div>
        )}
        {hasResults && !practiceTestResults && (
          <span className="text-sm text-gray-400">
            Test Cases:{' '}
            <span
              className={clsx(
                passedCount === totalCount ? 'text-green-400' : 'text-yellow-400'
              )}
            >
              {passedCount}/{totalCount} passed
            </span>
          </span>
        )}
        {!hasResults && (
          <span className="text-sm text-gray-500 italic">
            Run tests or submit to see results
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        Submit via header button
      </div>
    </div>
  );
}
