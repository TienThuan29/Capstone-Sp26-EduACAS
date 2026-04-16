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
} from "@heroicons/react/24/outline";
import { useExaminationDetail } from "@/hooks/examination/useExaminationDetail";
import { useRegradingRequest } from "@/hooks/regrading-request/useRegradingRequest";
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
  const [activeSection, setActiveSection] = useState<"info" | "code" | "testresults" | "regrading">("info");
  const [regradingReason, setRegradingReason] = useState("");
  const [regradingSuccess, setRegradingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const relatedRegrading = regradingRequests.filter(
    (r) => r.submissionId === submission?.id
  );

  const handleRegradingSubmit = async () => {
    // if (!regradingReason.trim() || !submission) return;
    // setSubmitting(true);
    // try {
    //   const ok = await submitFromExamDetail(examId, submission.id, regradingReason.trim());
    //   if (ok) {
    //     setRegradingSuccess(true);
    //     setRegradingReason("");
    //   }
    // } finally {
    //   setSubmitting(false);
    // }
  };

  const sectionTabs = [
    { id: "info" as const, label: "Info", icon: DocumentTextIcon },
    { id: "code" as const, label: "Source Code", icon: CodeBracketIcon },
    { id: "testresults" as const, label: "Test Results", icon: BugAntIcon },
    { id: "regrading" as const, label: "Regrading", icon: ClipboardDocumentListIcon },
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
                    {submission.testResults?.filter((t) => t.status === "PASSED").length ?? 0} / {submission.testResults?.length ?? 0} Passed
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

            {activeSection === "regrading" && (
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

                {/* Existing Regrading Requests */}
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
            )}
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
  const isPassed = result.status?.toUpperCase() === "PASSED";

  return (
    <div className={`rounded-lg border p-3 ${
      isPassed
        ? "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10"
        : "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
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
// Regrading Request Card Component
// ============================================================================

function RegradingRequestCard({ request }: { request: RegradingRequest }) {
  const statusConfig: Record<string, { color: string; icon: typeof ClockIcon }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: ClockIcon },
    APPROVED: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircleIcon },
    REJECTED: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: XCircleIcon },
    CANCELED: { color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300", icon: XMarkIcon },
  };
  const config = statusConfig[request.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
            <StatusIcon className="h-3 w-3" />
            {request.statusName || request.status}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(request.createdDate)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Reason</p>
          <p className="text-sm text-gray-900 dark:text-gray-200">{request.reason}</p>
        </div>
        
        {request.lecturerNote && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Lecturer Note ({request.statusName || request.status})
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-200">{request.lecturerNote}</p>
          </div>
        )}
        
        {request.handledDate && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Handled on: {formatDate(request.handledDate)}
          </p>
        )}
      </div>
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
}

function SubmissionsTab({ exam, submissions, onViewSubmission }: SubmissionsTabProps) {
  // Regrading modal state
  const [regradingModal, setRegradingModal] = useState<{
    isOpen: boolean;
    submission: SubmissionResponse | null;
    problemTitle: string;
    maxMark: number;
  }>({ isOpen: false, submission: null, problemTitle: "", maxMark: 0 });

  // Find the latest version for each problem
  const getLatestVersion = (subs: SubmissionResponse[]) => {
    if (subs.length === 0) return -1;
    return Math.max(...subs.map((s) => s.version));
  };

  const openRegradingModal = (sub: SubmissionResponse, problemTitle: string, maxMark: number) => {
    setRegradingModal({ isOpen: true, submission: sub, problemTitle, maxMark });
  };

  const closeRegradingModal = () => {
    setRegradingModal({ isOpen: false, submission: null, problemTitle: "", maxMark: 0 });
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
                        {!sub.regradingRequestId && (
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
                        {sub.regradingRequestId && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            <ClipboardDocumentListIcon className="h-3 w-3" />
                            Regraded
                          </span>
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
}

function RegradingModal({ isOpen, onClose, submission, problemTitle, maxMark, examId }: RegradingModalProps) {
  const { submitFromExamDetail } = useRegradingRequest();
  const [reason, setReason] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const MAX_IMAGES = 10;
  const MAX_IMAGE_SIZE_MB = 10;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const validateFiles = (files: File[]): { valid: boolean; error?: string } => {
    const currentCount = imageUrls.length;
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

    // Convert files to data URLs for preview (in production, upload to storage first)
    const newUrls: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const url = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newUrls.push(url);
    }

    setImageUrls((prev) => [...prev, ...newUrls]);
    e.target.value = "";
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

    const newUrls: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const url = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newUrls.push(url);
    }

    setImageUrls((prev) => [...prev, ...newUrls]);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !submission) return;
    setSubmitting(true);
    try {
      const ok = await submitFromExamDetail(examId, submission.id, reason.trim(), imageUrls);
      if (ok) {
        setSuccess(true);
        setReason("");
        setImageUrls([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!submission) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="lg" popup>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Request Regrading
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
            <div className="space-y-3">
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
                      : imageUrls.length >= MAX_IMAGES
                      ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 cursor-not-allowed opacity-60"
                      : "border-gray-300 bg-gray-50 hover:border-yellow-400 hover:bg-yellow-50 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-yellow-500 dark:hover:bg-yellow-900/10"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={imageUrls.length >= MAX_IMAGES}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
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
                {imageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
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
                  color="warning"
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
  const { myRequests } = useRegradingRequest({ enabled: false });

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
