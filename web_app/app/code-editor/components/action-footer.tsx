'use client';

import React from 'react';
import { Play, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useEditorContext } from '@/contexts/EditorContext';

// ----- Submission-related (commented out) -----
// import { SubmissionStatus } from '../types';
// function StatusBadge({ status }: { status: SubmissionStatus }) {
//   if (status === 'idle') return null;
//   const config: Record<
//     Exclude<SubmissionStatus, 'idle'>,
//     { label: string; icon: React.ReactNode; className: string }
//   > = {
//     queued: { label: 'Queued', icon: <Clock className="h-3.5 w-3.5" />, className: 'bg-gray-700 text-gray-300' },
//     processing: { label: 'Processing', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, className: 'bg-blue-600/20 text-blue-400 border border-blue-600/50' },
//     accepted: { label: 'Accepted', icon: <CheckCircle className="h-3.5 w-3.5" />, className: 'bg-green-600/20 text-green-400 border border-green-600/50' },
//     wrong_answer: { label: 'Wrong Answer', icon: <XCircle className="h-3.5 w-3.5" />, className: 'bg-red-600/20 text-red-400 border border-red-600/50' },
//     tle: { label: 'Time Limit Exceeded', icon: <Clock className="h-3.5 w-3.5" />, className: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50' },
//     runtime_error: { label: 'Runtime Error', icon: <AlertCircle className="h-3.5 w-3.5" />, className: 'bg-orange-600/20 text-orange-400 border border-orange-600/50' },
//     compilation_error: { label: 'Compilation Error', icon: <AlertCircle className="h-3.5 w-3.5" />, className: 'bg-orange-600/20 text-orange-400 border border-orange-600/50' },
//   };
//   const { label, icon, className } = config[status];
//   return (
//     <div className={clsx('flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', className)}>
//       {icon}
//       <span>{label}</span>
//     </div>
//   );
// }

export function ActionFooter() {
  const { runCode, isRunning, testCases } = useEditorContext();
  // const { submitCode, isSubmitting, submissionStatus } = useEditorContext(); // submission-related

  const passedCount = testCases.filter((tc) => 'status' in tc && (tc as { status: string }).status === 'pass').length;
  const totalCount = testCases.length;
  const hasResults = testCases.some((tc) => 'status' in tc && (tc as { status: string }).status !== 'untested');

  return (
    <div className="flex items-center justify-between border-t border-gray-700 bg-gray-900 px-4 py-3">
      {/* Left - Status */}
      <div className="flex items-center gap-4">
        {/* <StatusBadge status={submissionStatus} /> */}
        {hasResults && (
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
      </div>

      {/* Right - Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Run Code Button */}
        {/* <button
          onClick={runCode}
          disabled={isRunning}
          className={clsx(
            'flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
            isRunning
              ? 'cursor-not-allowed border-gray-600 bg-gray-700 text-gray-400'
              : 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white'
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Run Code</span>
            </>
          )}
        </button> */}

        {/* Submit Button (submission-related - commented out) */}
        {/* <button
          onClick={submitCode}
          disabled={isRunning || isSubmitting}
          className={clsx(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            isRunning || isSubmitting
              ? 'cursor-not-allowed bg-green-800/50 text-green-300/50'
              : 'bg-green-600 text-white hover:bg-green-700'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit</span>
            </>
          )}
        </button> */}
      </div>
    </div>
  );
}
