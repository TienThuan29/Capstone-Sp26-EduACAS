"use client";

import { useEffect, useState } from "react";
import { Spinner, Button, Modal, ModalHeader, ModalBody, TextInput, Textarea } from "flowbite-react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  CodeBracketIcon,
  BugAntIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import { useExaminationDetail } from "@/hooks/examination/useExaminationDetail";
import { useRegradingRequest } from "@/hooks/regrading-request/useRegradingRequest";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import type { Examination } from "@/types/examination";
import type { ProblemSubmissionsResponse, SubmissionResponse, TestResultResponse } from "@/types/submission";
import type { RegradingRequest } from "@/types/regrading-request";
import { CustomPagination } from "@/components/custom-pagination";

// ============================================================================
// Types & Interfaces
// ============================================================================

type SubTab = "overview" | "submissions";

interface ExamDetailPanelProps {
  examId: string;
  studentId?: string;
  onClose: () => void;
}

type SetActiveTab = (tab: SubTab) => void;

// ============================================================================
// Shared Helper Components & Functions
// ============================================================================

function getStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case "GRADED":
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircleIcon className="h-3 w-3" />
          Passed
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <XCircleIcon className="h-3 w-3" />
          Failed
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <ClockIcon className="h-3 w-3" />
          Pending
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          <ExclamationCircleIcon className="h-3 w-3" />
          {status ?? "Unknown"}
        </span>
      );
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

// ============================================================================
// Submission Detail Modal Component
// ============================================================================

interface SubmissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionResponse | null;
  problemTitle: string;
  maxMark: number;
  examId: string;
  regradingRequests?: RegradingRequest[];
}

function SubmissionDetailModal({
  isOpen,
  onClose,
  submission,
  problemTitle,
  maxMark,
  examId,
  regradingRequests = [],
}: SubmissionDetailModalProps) {
  const { submitFromExamDetail } = useRegradingRequest();
  const [activeSection, setActiveSection] = useState<"info" | "code" | "testresults" | "aifeedback" | "lecturerfeedback">("info");
  const [regradingReason, setRegradingReason] = useState("");
  const [regradingSuccess, setRegradingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const relatedRegrading = regradingRequests.filter(
    (r) => r.submissionId === submission?.id
  );

  const sectionTabs = [
    { id: "info" as const, label: "Info", icon: DocumentTextIcon },
    { id: "code" as const, label: "Source Code", icon: CodeBracketIcon },
    { id: "testresults" as const, label: "Test Results", icon: BugAntIcon },
    { id: "aifeedback" as const, label: "AI Feedback", icon: SparklesIcon },
    { id: "lecturerfeedback" as const, label: "Lecturer Feedback", icon: UserCircleIcon },
    // { id: "regrading" as const, label: "Regrading", icon: ClipboardDocumentListIcon },
  ];

  if (!submission) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="5xl" popup>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
            <CodeBracketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Submission Details
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
              {problemTitle}
            </p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col">
          {/* Submission Summary Bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(submission.status)}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {submission.finalScore}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">/ {maxMark} pts</p>
              </div>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="space-y-0.5">
                <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-600 dark:text-gray-300">v{submission.version}</span>
                  <span className="text-gray-400">|</span>
                  <span>{formatDate(submission.submittedDate)}</span>
                </p>
                {submission.languageId && (
                  <p className="text-xs text-gray-400">Language: {submission.languageId}</p>
                )}
              </div>
            </div>
            {relatedRegrading.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <ClipboardDocumentListIcon className="h-3 w-3" />
                {relatedRegrading.length} Regrading Request{relatedRegrading.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Section Tabs */}
          <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Section Content */}
          <div className="min-h-[300px]">
            {activeSection === "info" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      Submission Info
                    </h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Submission ID</dt>
                        <dd className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                          {submission.id}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Problem ID</dt>
                        <dd className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                          {submission.problemId}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Exam ID</dt>
                        <dd className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                          {submission.examId}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Submitted At</dt>
                        <dd className="text-gray-700 dark:text-gray-300">
                          {formatDate(submission.submittedDate)}
                        </dd>
                      </div>
                      {submission.gradedDate && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">Graded At</dt>
                          <dd className="text-gray-700 dark:text-gray-300">
                            {formatDate(submission.gradedDate)}
                          </dd>
                        </div>
                      )}
                      {submission.compilerId && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">Compiler</dt>
                          <dd className="text-gray-700 dark:text-gray-300">
                            {submission.compilerId}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      Student Info
                    </h4>
                    <dl className="space-y-2 text-sm">
                      {submission.student ? (
                        <>
                          <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">Student ID</dt>
                            <dd className="text-gray-700 dark:text-gray-300">
                              {submission.student.roleNumber || submission.studentId}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                            <dd className="text-gray-700 dark:text-gray-300">
                              {submission.student.fullname}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                            <dd className="text-gray-700 dark:text-gray-300">
                              {submission.student.email}
                            </dd>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">Student ID</dt>
                          <dd className="text-gray-700 dark:text-gray-300">{submission.studentId}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "code" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Source Code
                  </h4>
                  <Button size="xs" color="light" onClick={() => {
                    if (submission.source) {
                      navigator.clipboard.writeText(submission.source);
                    }
                  }}>
                    Copy Code
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <pre className="max-h-[400px] overflow-auto bg-gray-900 p-4 text-sm text-gray-100">
                    <code>{submission.source || "// No source code available"}</code>
                  </pre>
                </div>
              </div>
            )}

            {activeSection === "testresults" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Test Results
                  </h4>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {submission.testResults?.filter((t) => t.status === "SUCCESS").length ?? 0} / {submission.testResults?.length ?? 0} Passed
                  </span>
                </div>
                {submission.testResults && submission.testResults.length > 0 ? (
                  <div className="space-y-2">
                    {submission.testResults.map((result, idx) => (
                      <TestResultItem key={result.id} result={result} index={idx + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                    <BugAntIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      No test results available
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "aifeedback" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="h-5 w-5 text-yellow-500" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    AI Feedback
                  </h4>
                </div>
                {submission.aiFeedback ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{submission.aiFeedback}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                    <SparklesIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      No AI feedback available yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "lecturerfeedback" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircleIcon className="h-5 w-5 text-blue-500" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Lecturer Feedback
                  </h4>
                </div>
                {submission.lecturerFeedback ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{submission.lecturerFeedback}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                    <UserCircleIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      No lecturer feedback available yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* {activeSection === "regrading" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Submit Regrading Request
                    </h4>
                  </div>
                  <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                    If you believe there is an error in your grading for this submission,
                    submit a regrading request. The lecturer will review your submission
                    and update the score if necessary.
                  </p>

                  {regradingSuccess ? (
                    <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      <CheckCircleIcon className="h-5 w-5" />
                      Regrading request submitted successfully!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <TextInput
                          id="regrading-reason"
                          type="text"
                          placeholder="Enter reason for regrading request..."
                          value={regradingReason}
                          onChange={(e) => setRegradingReason(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={submitting || !regradingReason.trim()}
                        className="w-full"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <Spinner size="sm" />
                            Submitting...
                          </div>
                        ) : (
                          "Submit Regrading Request"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {relatedRegrading.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Regrading History
                    </h4>
                    {relatedRegrading.map((req) => (
                      <RegradingRequestCard key={req.id} request={req} />
                    ))}
                  </div>
                )}
              </div>
            )} */}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}

// ============================================================================
// Test Result Item Component
// ============================================================================

function TestResultItem({ result, index }: { result: TestResultResponse; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isPassed = result.status?.toUpperCase() === "SUCCESS";

  return (
    <div className={`rounded-lg border p-3 ${
      isPassed
        ? "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10"
        : "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            isPassed
              ? "bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300"
              : "bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300"
          }`}>
            {isPassed ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Test Case #{index}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {result.executionTimeMs}ms
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${
            isPassed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}>
            {result.status}
          </span>
          <ArrowRightIcon className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">Input</p>
              <pre className="overflow-auto rounded bg-white p-2 font-mono text-gray-800 dark:bg-gray-900 dark:text-gray-300 max-h-24">
                {result.input || "(no input)"}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">Expected Output</p>
              <pre className="overflow-auto rounded bg-white p-2 font-mono text-gray-800 dark:bg-gray-900 dark:text-gray-300 max-h-24">
                {result.expectedOutput || "(no expected output)"}
              </pre>
            </div>
          </div>
          <div>
            <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">Your Output</p>
            <pre className={`overflow-auto rounded p-2 font-mono text-sm max-h-32 ${
              isPassed
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            }`}>
              {result.actualOutput || "(no output)"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Overview Tab Component
// ============================================================================

interface OverviewTabProps {
  exam: Examination;
  submissions: ProblemSubmissionsResponse[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
}

function OverviewTab({ exam, submissions, currentPage, setCurrentPage, pageSize }: OverviewTabProps) {
  const totalScore = submissions.reduce((sum, ps) => {
    const best = ps.submissions[0];
    return sum + (best?.finalScore ?? 0);
  }, 0);

  const totalPages = Math.ceil(submissions.length / pageSize);
  const paginatedSubmissions = submissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      {/* Exam Meta */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Mark</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {exam.totalMark}
          </p>
        </div>
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <p className="text-xs text-gray-500 dark:text-gray-400">Problems</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {exam.examProblems?.length ?? exam.problems?.length ?? 0}
          </p>
        </div>
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <p className="text-xs text-gray-500 dark:text-gray-400">Language</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {exam.programmingLanguage?.name ?? "-"}
          </p>
        </div>
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
            {exam.status?.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Description */}
      {exam.description && (
        <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Description
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{exam.description}</p>
        </div>
      )}

      {/* Score Summary */}
      {submissions.length > 0 && (
        <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
          <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            Your Score Summary
          </p>
          <div className="space-y-2">
            {paginatedSubmissions.map((ps) => {
              const best = ps.submissions[0];
              return (
                <div
                  key={ps.problemId}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {best?.problem?.title ?? exam.problems?.find((p) => p.id === ps.problemId)?.title ?? ps.problemId}
                  </span>
                  <div className="flex items-center gap-2">
                    {best ? getStatusBadge(best.status) : null}
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {best?.finalScore ?? 0}
                    </span>
                    <span className="text-xs text-gray-400">
                      /{exam.examProblems?.find((ep) => ep.problemId === ps.problemId)?.mark ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
            <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {totalScore} / {exam.totalMark}
            </span>
          </div>
          <div className="mt-2 flex justify-end text-xs text-gray-400 dark:text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, submissions.length)} of {submissions.length}
          </div>
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Submissions Tab Component
// ============================================================================

interface SubmissionsTabProps {
  exam: Examination;
  submissions: ProblemSubmissionsResponse[];
  onViewSubmission: (submission: SubmissionResponse, problemTitle: string, maxMark: number) => void;
  regradingRequests?: RegradingRequest[];
  onRegradingSuccess?: () => void;
}

function SubmissionsTab({ exam, submissions, onViewSubmission, regradingRequests = [], onRegradingSuccess }: SubmissionsTabProps) {
  // Regrading modal state
  const [regradingModal, setRegradingModal] = useState<{
    isOpen: boolean;
    submission: SubmissionResponse | null;
    problemTitle: string;
    maxMark: number;
    existingRequest?: RegradingRequest | null;
  }>({ isOpen: false, submission: null, problemTitle: "", maxMark: 0 });

  // Find the latest version for each problem
  const getLatestVersion = (subs: SubmissionResponse[]) => {
    if (subs.length === 0) return -1;
    return Math.max(...subs.map((s) => s.version));
  };

  const openRegradingModal = (sub: SubmissionResponse, problemTitle: string, maxMark: number, existingRequest?: RegradingRequest | null) => {
    setRegradingModal({ isOpen: true, submission: sub, problemTitle, maxMark, existingRequest });
  };

  const closeRegradingModal = () => {
    setRegradingModal({ isOpen: false, submission: null, problemTitle: "", maxMark: 0, existingRequest: undefined });
  };

  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No submissions found.
        </p>
      ) : (
        submissions.map((ps) => {
          const problemTitle = ps.submissions[0]?.problem?.title ?? exam.problems?.find((p) => p.id === ps.problemId)?.title ?? ps.problemId;
          const maxMark = exam.examProblems?.find((ep) => ep.problemId === ps.problemId)?.mark ?? 0;
          const latestVersion = getLatestVersion(ps.submissions);
          return (
            <div
              key={ps.problemId}
              className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {problemTitle}
                </h4>
                {ps.submissions[0]
                  ? getStatusBadge(ps.submissions[0].status)
                  : getStatusBadge("UNKNOWN")}
              </div>
              <div className="space-y-2">
                {ps.submissions.map((sub) => {
                  console.log(sub.regradingRequestId)
                  const isLatest = sub.version === latestVersion;
                  return (
                    <div
                      key={sub.id}
                      className={`flex items-center justify-between rounded-md border p-2 text-xs transition-colors ${
                        isLatest
                          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10"
                          : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">v{sub.version}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDate(sub.submittedDate)}
                        </span>
                        {isLatest && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            Latest
                          </span>
                        )}
                        <span
                          className={`font-bold ${
                            isLatest ? "text-gray-900 dark:text-white" : "text-gray-500"
                          }`}
                        >
                          {sub.finalScore}
                        </span>
                        <span className="text-gray-400">/{maxMark}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          color="light"
                          onClick={() => onViewSubmission(sub, problemTitle, maxMark)}
                          className="cursor-pointer"
                        >
                          <EyeIcon className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {!sub.regradingRequestId && isLatest && (
                          <Button
                            size="xs"
                            color="blue"
                            onClick={() => openRegradingModal(sub, problemTitle, maxMark)}
                            className="cursor-pointer"
                          >
                            <ChatBubbleLeftRightIcon className="mr-1 h-3 w-3" />
                            Regrade
                          </Button>
                        )}
                        {!sub.regradingRequestId && !isLatest && (
                          <span className="text-xs text-gray-400" title="Only the latest submission can be regraded">
                            Not eligible
                          </span>
                        )}
                        {sub.regradingRequestId && (
                          <Button
                            size="xs"
                            color="yellow"
                            onClick={() => {
                              const existingReq = regradingRequests.find((r) => r.id === sub.regradingRequestId);
                              openRegradingModal(sub, problemTitle, maxMark, existingReq);
                            }}
                            className="cursor-pointer"
                          >
                            <ClipboardDocumentListIcon className="mr-1 h-3 w-3" />
                            View Request
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Regrading Modal */}
      <RegradingModal
        isOpen={regradingModal.isOpen}
        onClose={closeRegradingModal}
        submission={regradingModal.submission}
        problemTitle={regradingModal.problemTitle}
        maxMark={regradingModal.maxMark}
        examId={exam?.id ?? ""}
        existingRegradingRequest={regradingModal.existingRequest}
        onSuccess={onRegradingSuccess}
      />
    </div>
  );
}

// ============================================================================
// Regrading Modal Component (for submissions tab)
// ============================================================================

interface RegradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionResponse | null;
  problemTitle: string;
  maxMark: number;
  examId: string;
  existingRegradingRequest?: RegradingRequest | null;
  onSuccess?: () => void;
}

function RegradingModal({ isOpen, onClose, submission, problemTitle, maxMark, examId, existingRegradingRequest, onSuccess }: RegradingModalProps) {
  const { submitFromExamDetail, getById, cancel } = useRegradingRequest();
  const { uploadFile, getFileUrl } = usePrivateS3();
  const [reason, setReason] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedPresignedUrls, setUploadedPresignedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<RegradingRequest | null>(null);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); // Presigned URLs for existing request images
  const [canceling, setCanceling] = useState(false);

  // Determine if we're viewing an existing request or creating a new one
  const isViewingExisting = Boolean(submission?.regradingRequestId || existingRegradingRequest);

  // Load existing regrading request when modal opens
  useEffect(() => {
    if (!isOpen || !submission?.regradingRequestId) {
      // Reset state when modal closes
      setExistingRequest(null);
      setExistingImageUrls([]);
      setReason("");
      setUploadedImageUrls([]);
      setUploadedPresignedUrls([]);
      setSuccess(false);
      return;
    }

    const loadExisting = async () => {
      setLoadingExisting(true);
      try {
        // Use passed existing request or fetch by ID
        if (existingRegradingRequest) {
          setExistingRequest(existingRegradingRequest);
          // Convert existing image filenames to presigned URLs
          await convertExistingImageUrls(existingRegradingRequest.imageUrls || []);
        } else {
          const req = await getById(submission.regradingRequestId!);
          setExistingRequest(req);
          // Convert existing image filenames to presigned URLs
          await convertExistingImageUrls(req?.imageUrls || []);
        }
      } catch (err) {
        console.error("Failed to load regrading request:", err);
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExisting();
  }, [isOpen, submission?.regradingRequestId, existingRegradingRequest, getById]);

  // Convert S3 filenames to presigned URLs for existing request images
  const convertExistingImageUrls = async (imageUrls: string[]) => {
    if (!imageUrls || imageUrls.length === 0) {
      setExistingImageUrls([]);
      return;
    }

    const urls: string[] = [];
    for (const filename of imageUrls) {
      try {
        const presignedUrl = await getFileUrl(filename);
        urls.push(presignedUrl);
      } catch {
        // If getFileUrl fails, use the filename itself (though preview won't work)
        urls.push(filename);
      }
    }
    setExistingImageUrls(urls);
  };

  const MAX_IMAGES = 10;
  const MAX_IMAGE_SIZE_MB = 10;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const validateFiles = (files: File[]): { valid: boolean; error?: string } => {
    const currentCount = uploadedImageUrls.length;
    if (currentCount + files.length > MAX_IMAGES) {
      return { valid: false, error: `Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - currentCount} more.` };
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return { valid: false, error: `${file.name} is not an image file.` };
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: `${file.name} exceeds ${MAX_IMAGE_SIZE_MB}MB limit.` };
      }
    }

    return { valid: true };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validation = validateFiles(files);
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid file");
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const filenames: string[] = [];
      const presignedUrls: string[] = [];
      for (const file of files) {
        const filename = await uploadFile(file);
        filenames.push(filename);
        // Get presigned URL for preview
        try {
          const presignedUrl = await getFileUrl(filename);
          presignedUrls.push(presignedUrl);
        } catch {
          // If getFileUrl fails, use filename (though preview won't work)
          presignedUrls.push(filename);
        }
      }
      setUploadedImageUrls((prev) => [...prev, ...filenames]);
      setUploadedPresignedUrls((prev) => [...prev, ...presignedUrls]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setUploadError(err.response?.data?.message ?? "Failed to upload images");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const validation = validateFiles(files);
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid file");
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const filenames: string[] = [];
      const presignedUrls: string[] = [];
      for (const file of files) {
        const filename = await uploadFile(file);
        filenames.push(filename);
        // Get presigned URL for preview
        try {
          const presignedUrl = await getFileUrl(filename);
          presignedUrls.push(presignedUrl);
        } catch {
          presignedUrls.push(filename);
        }
      }
      setUploadedImageUrls((prev) => [...prev, ...filenames]);
      setUploadedPresignedUrls((prev) => [...prev, ...presignedUrls]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setUploadError(err.response?.data?.message ?? "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadedPresignedUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !submission) return;
    setSubmitting(true);
    try {
      // Use filenames (not presigned URLs) for backend storage
      const ok = await submitFromExamDetail(examId, submission.id, reason.trim(), uploadedImageUrls);
      if (ok) {
        setSuccess(true);
        setReason("");
        setUploadedImageUrls([]);
        setUploadedPresignedUrls([]);
        // Notify parent to refresh data
        onSuccess?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!existingRequest?.id) return;
    setCanceling(true);
    try {
      const ok = await cancel(existingRequest.id);
      if (ok) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setCanceling(false);
    }
  };

  if (!submission) return null;

  // Determine if viewing existing request
  const displayRequest = existingRequest || (submission.regradingRequestId ? existingRequest : null);
  const isViewMode = Boolean(displayRequest);

  return (
    <Modal show={isOpen} onClose={onClose} size="lg" popup>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {isViewMode ? "Regrading Request Details" : "Request Regrading"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {problemTitle} - v{submission.version}
            </p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Submission Info Summary */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <div className="flex items-center gap-4">
              {getStatusBadge(submission.status)}
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {submission.finalScore}
                </p>
                <p className="text-xs text-gray-500">/ {maxMark} pts</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(submission.submittedDate)}
            </span>
          </div>

          {isViewMode ? (
            // VIEW MODE: Display existing request
            loadingExisting ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
                <span className="ml-2 text-sm text-gray-500">Loading request details...</span>
              </div>
            ) : displayRequest ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {displayRequest.status === "PENDING" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      <ClockIcon className="h-3 w-3" />
                      Pending Review
                    </span>
                  )}
                  {displayRequest.status === "APPROVED" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircleIcon className="h-3 w-3" />
                      Approved
                    </span>
                  )}
                  {displayRequest.status === "REJECTED" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      <XCircleIcon className="h-3 w-3" />
                      Rejected
                    </span>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Reason
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {displayRequest.reason}
                  </div>
                </div>

                {/* Lecturer Note */}
                {displayRequest.lecturerNote && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lecturer's Response
                    </label>
                    <div className="rounded-lg border border-gray-200 bg-blue-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-blue-900/20 dark:text-blue-200">
                      {displayRequest.lecturerNote}
                    </div>
                  </div>
                )}

                {/* Proof Images */}
                {existingImageUrls.length > 0 && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Proof Images ({existingImageUrls.length})
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {existingImageUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors dark:border-gray-700"
                        >
                          <img
                            src={url}
                            alt={`Proof ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitted Date */}
                <div className="text-xs text-gray-500">
                  Submitted: {formatDate(displayRequest.createdDate)}
                </div>

                {/* Canceled Status Badge */}
                {displayRequest.status === "CANCELED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    <XCircleIcon className="h-3 w-3" />
                    Canceled
                  </span>
                )}

                {/* Cancel Button - Only show for PENDING requests */}
                {displayRequest.status === "PENDING" && (
                  <div className="flex justify-end pt-2">
                    <Button
                      color="failure"
                      size="sm"
                      onClick={handleCancel}
                      disabled={canceling}
                    >
                      {canceling ? (
                        <div className="flex items-center gap-2">
                          <Spinner size="sm" />
                          Canceling...
                        </div>
                      ) : (
                        "Cancel Request"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">
                Failed to load request details.
              </div>
            )
          ) : (
            // CREATE MODE: New regrading request form
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you believe there is an error in your grading, please explain your reason below.
                The lecturer will review your submission and update the score if necessary.
              </p>
              <p className="text-red-400 text-sm">Note: Regrading request make just only one time.</p>

              {success ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  <CheckCircleIcon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Regrading request submitted!</p>
                    <p className="text-xs">The lecturer will review your request shortly.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reason for Regrading <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why you believe your answer deserves a higher score..."
                      rows={4}
                      required
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Proof Images <span className="text-gray-400">(optional)</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload up to {MAX_IMAGES} images (max {MAX_IMAGE_SIZE_MB}MB each)
                    </p>

                    {/* Drop Zone */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                        uploadError
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
                          : uploadedImageUrls.length >= MAX_IMAGES || uploading
                          ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 cursor-not-allowed opacity-60"
                          : "border-gray-300 bg-gray-50 hover:border-yellow-400 hover:bg-yellow-50 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-yellow-500 dark:hover:bg-yellow-900/10"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        disabled={uploadedImageUrls.length >= MAX_IMAGES || uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <CloudArrowUpIcon className={`mx-auto h-8 w-8 ${uploading ? "animate-bounce" : "text-gray-400"}`} />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to {MAX_IMAGE_SIZE_MB}MB</p>
                    </div>

                    {/* Error Message */}
                    {uploadError && (
                      <p className="mt-1 text-xs text-red-500">{uploadError}</p>
                    )}

                    {/* Image Preview Grid */}
                    {uploadedPresignedUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {uploadedPresignedUrls.map((presignedUrl: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={presignedUrl}
                              alt={`Proof ${index + 1}`}
                              className="h-16 w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      color="light"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      color="blue "
                      onClick={handleSubmit}
                      disabled={submitting || !reason.trim()}
                      className="flex-1"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <Spinner size="sm" />
                          Submitting...
                        </div>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

// ============================================================================
// Main ExamDetailPanel Component
// ============================================================================

export function ExamDetailPanel({ examId, onClose }: ExamDetailPanelProps) {
  const { exam, submissions, loading, error, loadDetail } = useExaminationDetail();
  const [activeTab, setActiveTab] = useState<SubTab>("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Submission detail modal state
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResponse | null>(null);
  const [selectedProblemTitle, setSelectedProblemTitle] = useState("");
  const [selectedMaxMark, setSelectedMaxMark] = useState(0);

  // Fetch regrading requests for the student
  const { myRequests, refresh } = useRegradingRequest({ enabled: false });

  useEffect(() => {
    void loadDetail(examId);
  }, [examId, loadDetail]);

  useEffect(() => {
    setCurrentPage(1);
  }, [submissions.length]);

  const handleViewSubmission = (submission: SubmissionResponse, problemTitle: string, maxMark: number) => {
    setSelectedSubmission(submission);
    setSelectedProblemTitle(problemTitle);
    setSelectedMaxMark(maxMark);
  };

  const handleCloseModal = () => {
    setSelectedSubmission(null);
    setSelectedProblemTitle("");
    setSelectedMaxMark(0);
  };

  const handleRegradingSuccess = () => {
    // Refresh regrading requests and exam detail
    void refresh();
    void loadDetail(examId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" color="info" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error ?? "Exam not found"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          color="light"
          onClick={onClose}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {exam.examName}
          </h2>
          <p className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              {formatDate(exam.startDatetime)} — {formatDate(exam.endDatetime)}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {exam.mode}
            </span>
          </p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <Button
          size="none"
          className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </Button>
        <Button
          size="none"
          className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none transition-colors cursor-pointer ${
            activeTab === "submissions"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent"
          }`}
          onClick={() => setActiveTab("submissions")}
        >
          Submissions
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          exam={exam}
          submissions={submissions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
        />
      )}

      {activeTab === "submissions" && (
        <SubmissionsTab
          exam={exam}
          submissions={submissions}
          onViewSubmission={handleViewSubmission}
          regradingRequests={myRequests}
          onRegradingSuccess={handleRegradingSuccess}
        />
      )}
      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        isOpen={!!selectedSubmission}
        onClose={handleCloseModal}
        submission={selectedSubmission}
        problemTitle={selectedProblemTitle}
        maxMark={selectedMaxMark}
        examId={examId}
        regradingRequests={myRequests}
      />
    </div>
  );
}
