"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  History,
  Lightbulb,
  Copy,
  Check,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import { Spinner } from "flowbite-react";
import { useEditorContext } from "@/contexts/EditorContext";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { DIFFICULTY } from "@/types/problem";

type ProblemTab = "problem" | "submissions" ;

function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-3">
      <pre
        className={clsx(
          "overflow-x-auto rounded-md bg-gray-900 p-4 text-sm",
          className,
        )}
      >
        <code className="text-gray-200">{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 rounded p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-700 hover:text-white"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// function getStatusIcon(status: SubmissionStatus) {
//   switch (status) {
//     case "accepted":
//       return <CheckCircle className="h-4 w-4 text-green-500" />;
//     case "wrong_answer":
//       return <XCircle className="h-4 w-4 text-red-500" />;
//     case "tle":
//       return <Clock className="h-4 w-4 text-yellow-500" />;
//     case "runtime_error":
//     case "compilation_error":
//       return <AlertCircle className="h-4 w-4 text-orange-500" />;
//     default:
//       return <Clock className="h-4 w-4 text-gray-400" />;
//   }
// }

// function getStatusLabel(status: SubmissionStatus) {
//   switch (status) {
//     case "accepted":
//       return "Accepted";
//     case "wrong_answer":
//       return "Wrong Answer";
//     case "tle":
//       return "Time Limit Exceeded";
//     case "runtime_error":
//       return "Runtime Error";
//     case "compilation_error":
//       return "Compilation Error";
//     default:
//       return status;
//   }
// }

const TABS = [
  { id: "problem" as const, label: "Problem", icon: FileText },
  { id: "submissions" as const, label: "Submission Histories", icon: History },
  // { id: "hints" as const, label: "Hints", icon: Lightbulb },
];

export function ProblemPanel() {
  const [activeTab, setActiveTab] = useState<ProblemTab>("problem");

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium",
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-400 hover:text-gray-200",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "problem" && <DescriptionTab />}
        {activeTab === "submissions" && <SubmissionsTab />}
        {/* {activeTab === "hints" && <HintsTab />} */}
      </div>
    </div>
  );
}


// ------- Tab Panels -------

function DescriptionTab() {
  const { problem } = useEditorContext();
  const { getFileUrl } = usePrivateS3();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!problem?.fileName?.trim()) {
      setPdfUrl(null);
      return;
    }
    let cancelled = false;
    setPdfLoading(true);
    setPdfUrl(null);
    getFileUrl(problem.fileName)
      .then((url) => {
        if (!cancelled) setPdfUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPdfUrl(null);
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [problem?.fileName, getFileUrl]);

  return (
    <div className="prose prose-invert max-w-none">
      {/* Problem Title & Difficulty */}
      <div className="mb-4 flex items-center gap-3">
        <h1 className="m-0 text-xl font-bold text-white">
          {problem?.title || "Two Sum"}
        </h1>
        <span
          className={clsx(
            "rounded px-2 py-0.5 text-xs font-medium",
            (problem?.difficulty || DIFFICULTY.EASY) === DIFFICULTY.EASY &&
              "bg-green-500/20 text-green-500",
            (problem?.difficulty || DIFFICULTY.MEDIUM) === DIFFICULTY.MEDIUM &&
              "bg-yellow-500/20 text-yellow-500",
            (problem?.difficulty || DIFFICULTY.HARD) === DIFFICULTY.HARD &&
              "bg-red-500/20 text-red-500",
          )}
        >
          {problem?.difficulty || DIFFICULTY.EASY}
        </span>
      </div>

      {/* Time & Memory Limits */}
      {/* <div className="mb-4 flex gap-4 text-sm text-gray-400">
        <span>Time Limit: {problem?.timeLimit || 2}s</span>
        <span>Memory Limit: {problem?.memoryLimit || 256}MB</span>
      </div> */}

      {/* Markdown Content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="rounded bg-gray-800 px-1.5 py-0.5 text-sm text-pink-400"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          pre({ children }) {
            return <>{children}</>;
          },
          h2({ children }) {
            return (
              <h2 className="mt-6 mb-3 text-lg font-semibold text-white">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="mt-4 mb-2 text-base font-semibold text-gray-200">
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <p className="mb-3 text-gray-300">{children}</p>;
          },
          ul({ children }) {
            return (
              <ul className="mb-3 list-disc space-y-1 pl-5 text-gray-300">
                {children}
              </ul>
            );
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-white">{children}</strong>
            );
          },
        }}
      >
        {problem?.content || ''}
      </ReactMarkdown>

      {/* Attach file: display PDF when problem.fileName is set */}
      {problem?.fileName?.trim() ? (
        <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50">
          <div className="border-b border-gray-700 px-4 py-2 text-sm font-medium text-gray-300">
            Problem attachment
          </div>
          <div className="min-h-[200px] p-2">
            {pdfLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center gap-3 text-gray-400">
                <Spinner size="lg" />
                <span className="text-sm">Loading preview...</span>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Problem attachment"
                className="h-[75vh] w-full rounded border-0"
              />
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center p-8 text-center text-sm text-gray-500">
                No preview available
              </div>
            )}
          </div>
        </div>
      ) : null}

    </div>
  );
}

function SubmissionsTab() {
  // const { submissions } = useEditorContext();

  // if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <History className="mb-3 h-12 w-12 opacity-50" />
        <p className="text-sm">No submissions yet</p>
      </div>
    );
  // }

  // return (
  //   <div className="space-y-3">
  //     {submissions.map((submission) => (
  //       <div
  //         key={submission.id}
  //         className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
  //       >
  //         <div className="flex items-center justify-between">
  //           <div className="flex items-center gap-2">
  //             {getStatusIcon(submission.status)}
  //             <span
  //               className={clsx(
  //                 "font-medium",
  //                 submission.status === "accepted"
  //                   ? "text-green-500"
  //                   : "text-red-500",
  //               )}
  //             >
  //               {getStatusLabel(submission.status)}
  //             </span>
  //           </div>
  //           <span className="text-xs text-gray-500">
  //             {submission.timestamp.toLocaleString()}
  //           </span>
  //         </div>
  //         <div className="mt-2 flex gap-4 text-xs text-gray-400">
  //           <span>Language: {submission.language}</span>
  //           {submission.executionTime && (
  //             <span>Runtime: {submission.executionTime.toFixed(0)}ms</span>
  //           )}
  //           {submission.memoryUsed && (
  //             <span>Memory: {submission.memoryUsed.toFixed(1)}MB</span>
  //           )}
  //           {submission.passedTestCases !== undefined && (
  //             <span>
  //               Test Cases: {submission.passedTestCases}/
  //               {submission.totalTestCases}
  //             </span>
  //           )}
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  // );
}

// function HintsTab() {
//   const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());

//   const toggleHint = (index: number) => {
//     setExpandedHints((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(index)) {
//         newSet.delete(index);
//       } else {
//         newSet.add(index);
//       }
//       return newSet;
//     });
//   };

//   return (
//     <div className="space-y-3">
//       {MOCK_HINTS.map((hint, index) => (
//         <div
//           key={index}
//           className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800"
//         >
//           <button
//             onClick={() => toggleHint(index)}
//             className="hover:bg-gray-750 flex w-full items-center justify-between p-4 text-left transition-colors"
//           >
//             <span className="flex items-center gap-2 font-medium text-gray-200">
//               <Lightbulb className="h-4 w-4 text-yellow-500" />
//               Hint {index + 1}
//             </span>
//             <ChevronRight
//               className={clsx(
//                 "h-5 w-5 text-gray-400 transition-transform",
//                 expandedHints.has(index) && "rotate-90",
//               )}
//             />
//           </button>
//           {expandedHints.has(index) && (
//             <div className="bg-gray-850 border-t border-gray-700 p-4 text-sm text-gray-300">
//               {hint}
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }
