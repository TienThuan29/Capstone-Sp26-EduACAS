"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Button,
  Tooltip,
  Label,
  Select,
  HR,
  Modal,
  ModalHeader,
  ModalBody,
  Textarea,
} from "flowbite-react";
import {
  ArrowPathIcon,
  CommandLineIcon,
  DocumentTextIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { Examination } from "@/types/examination";
import type {
  SubmissionResponse,
  SubmissionGradingRequest,
  AutoGradeProblemResponse,
} from "@/types/submission";
import type { ClassroomStudentResponse } from "@/types/classroom";
import type { RegradingRequest } from "@/types/regrading-request";
import { useStudentClassroom } from "@/hooks/classroom/useStudentClassroom";
import { useSubmissionLecturer } from "@/hooks/submission/useSubmissionLecturer";
import { useRegradingRequestManagement } from "@/hooks/regrading-request/useRegradingRequstManagement";
import { usePrivateS3 } from "@/hooks/s3/usePrivateS3";
import { formatDate } from "@/utils/datetime-utils";
import { CustomPagination } from "@/components/custom-pagination";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { SubmissionDetail } from "./submission-detail";
import { WarningModal } from "@/app/code-editor/components/warning-modal";
import { deriveExamViolationFlag, type ExamViolationFlag } from "@/utils/exam-log-flag";
import { useExamLog } from "@/hooks/examination/useExamLog";
import { useAcademicWarning } from "@/hooks/academic-warning/useAcademicWarning";

export type SubmissionsTabContentProps = {
  examination: Examination;
};

const SUBMISSIONS_PAGE_SIZE = 10;

type ProblemSubmissions = {
  problemId: string;
  mark: number;
  submissions: SubmissionResponse[];
};

export function SubmissionsTabContent({
  examination,
}: SubmissionsTabContentProps) {
  const router = useRouter();
  const { getStudentsByClassId } = useStudentClassroom();
  const { getLatestSubmissionsByExam, runAutoGrading, reGradeSubmission } = useSubmissionLecturer();
  const { getExamLogsBySubmission } = useExamLog();
  const { sendBatchAcademicWarnings } = useAcademicWarning();
  const { getBySubmissionId, approve, reject, loading: regradingLoading } = useRegradingRequestManagement();
  const { getFileUrl } = usePrivateS3();

  const [students, setStudents] = useState<ClassroomStudentResponse[]>([]);
  const [problemSubmissions, setProblemSubmissions] = useState<
    ProblemSubmissions[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");
  const [currentPageByProblem, setCurrentPageByProblem] = useState<
    Record<string, number>
  >({});

  /** Whether the confirm-run-auto-grading modal is open. */
  const [showGradingConfirmModal, setShowGradingConfirmModal] = useState(false);
  const [gradingConfirmLoading, setGradingConfirmLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState(0);
  /** Submission id to show in detail (in-page); null = show list. */
  const [detailSubmissionId, setDetailSubmissionId] = useState<string | null>(null);
  const [detailStudentName, setDetailStudentName] = useState<string | undefined>(undefined);
  /** Message to show after auto-grading completes (success or error). */
  const [gradingResult, setGradingResult] = useState<{
    success: boolean;
    message: string;
    detail?: AutoGradeProblemResponse;
  } | null>(null);
  const [submissionFlags, setSubmissionFlags] = useState<Record<string, ExamViolationFlag>>({});
  const [flagLoadingBySubmission, setFlagLoadingBySubmission] = useState<Record<string, boolean>>({});

  /** Single re-grade modal state */
  const [regradeTarget, setRegradeTarget] = useState<{
    submission: SubmissionResponse;
    studentName: string;
  } | null>(null);
  const [regradeLoading, setRegradeLoading] = useState(false);

  /** Regrading request modal state */
  const [regradingModal, setRegradingModal] = useState<{
    isOpen: boolean;
    submission: SubmissionResponse | null;
    studentName: string;
  } | null>(null);
  const [regradingRequest, setRegradingRequest] = useState<RegradingRequest | null>(null);
  const [regradingImageUrls, setRegradingImageUrls] = useState<string[]>([]);
  const [lecturerNote, setLecturerNote] = useState("");
  const [handleLoading, setHandleLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningResult, setWarningResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [sendingWarning, setSendingWarning] = useState(false);
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

  const classId = examination.classroom?.id;
  const examId = examination.id;

  /** Backend list API returns examProblems (problemId + mark), not full problems[]. Use this for submission queries. */
  const examProblems = useMemo(
    () => examination.examProblems ?? [],
    [examination.examProblems],
  );

  const studentIdToName = students.reduce<Record<string, string>>(
    (acc, s) => ({
      ...acc,
      [s.studentId]: s.fullname || s.email || s.studentId,
    }),
    {},
  );

  const displayedProblems = useMemo(() => {
    if (!selectedProblemId) return problemSubmissions;
    return problemSubmissions.filter((p) => p.problemId === selectedProblemId);
  }, [problemSubmissions, selectedProblemId]);

  const visibleSubmissionIds = useMemo(() => {
    const ids: string[] = [];
    for (const { problemId, submissions } of displayedProblems) {
      const currentPage = currentPageByProblem[problemId] ?? 1;
      const pageItems = submissions.slice(
        (currentPage - 1) * SUBMISSIONS_PAGE_SIZE,
        currentPage * SUBMISSIONS_PAGE_SIZE,
      );
      for (const sub of pageItems) {
        ids.push(sub.id);
      }
    }
    return ids;
  }, [currentPageByProblem, displayedProblems]);

  /**
   * Fetch data for the submissions tab (single batch request for all problems).
   */
  const fetchData = useCallback(async () => {
    if (!classId || !examId) return;
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, submissionsByProblem] = await Promise.all([
        getStudentsByClassId(classId),
        getLatestSubmissionsByExam(examId),
      ]);
      setStudents(studentsRes);
      const byProblemId = new Map(
        submissionsByProblem.map((p) => [p.problemId, p.submissions])
      );
      setProblemSubmissions(
        examProblems.map((ep) => ({
          problemId: ep.problemId,
          mark: ep.mark,
          submissions: byProblemId.get(ep.problemId) ?? [],
        }))
      );
    } catch (err) {
      console.error("Failed to load submissions", err);
      setError("Failed to load submissions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [classId, examId, examProblems, getStudentsByClassId, getLatestSubmissionsByExam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const idsToFetch = visibleSubmissionIds.filter(
      (id) => submissionFlags[id] == null && !flagLoadingBySubmission[id],
    );
    if (idsToFetch.length === 0) return;

    idsToFetch.forEach((id) => {
      setFlagLoadingBySubmission((prev) => ({ ...prev, [id]: true }));
      void (async () => {
        try {
          const logs = await getExamLogsBySubmission(id);
          const flag = deriveExamViolationFlag(logs);
          setSubmissionFlags((prev) => ({ ...prev, [id]: flag }));
        } catch {
          setSubmissionFlags((prev) => ({ ...prev, [id]: "CLEAN" }));
        } finally {
          setFlagLoadingBySubmission((prev) => ({ ...prev, [id]: false }));
        }
      })();
    });
  }, [flagLoadingBySubmission, getExamLogsBySubmission, submissionFlags, visibleSubmissionIds]);

  useEffect(() => {
    if (!gradingConfirmLoading) {
      setLoadingDots(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingDots((d) => (d + 1) % 3);
    }, 400);
    return () => clearInterval(id);
  }, [gradingConfirmLoading]);

  /**
   * Build request payload for one submission for auto-grade API.
   */
  const toGradingRequest = useCallback(
    (sub: SubmissionResponse): SubmissionGradingRequest => ({
      id: sub.id,
      studentId: sub.studentId,
      languageId: sub.languageId ?? "",
      compilerId: sub.compilerId ?? "",
      examId: sub.examId,
      problemId: sub.problemId,
      source: sub.source ?? "",
    }),
    []
  );

  /**
   * Handle run auto-grading for the selected problem.
   */
  const handleRunAutoGrading = useCallback(async () => {
    if (!selectedProblemId || !examId) return;
    setShowGradingConfirmModal(false);
    setGradingConfirmLoading(true);
    setGradingResult(null);
    try {
      const selected = problemSubmissions.find(
        (p) => p.problemId === selectedProblemId
      );
      const submissions = selected?.submissions ?? [];
      if (submissions.length === 0) {
        setGradingResult({
          success: false,
          message: "No submissions to grade for this problem.",
        });
        return;
      }
      const request = {
        examId,
        problemId: selectedProblemId,
        submissions: submissions.map(toGradingRequest),
      };
      const result = await runAutoGrading(request);
      setGradingResult({
        success: result.failedCount === 0,
        message:
          result.failedCount === 0
            ? `Auto-grading completed. Graded ${result.gradedCount} submission(s).`
            : `Auto-grading completed. Graded ${result.gradedCount} submission(s), ${result.failedCount} failed.`,
        detail: result,
      });
      await fetchData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Auto-grading failed.";
      setGradingResult({ success: false, message });
    } finally {
      setGradingConfirmLoading(false);
    }
  }, [
    selectedProblemId,
    examId,
    problemSubmissions,
    toGradingRequest,
    runAutoGrading,
    fetchData,
  ]);

  /**
   * Handle re-grade for a single submission.
   */
  const handleRegrade = useCallback(async () => {
    if (!regradeTarget) return;
    const { submission } = regradeTarget;
    setRegradeLoading(true);
    try {
      await reGradeSubmission(
        submission.id,
        submission.languageId ?? "",
        submission.compilerId ?? ""
      );
      void fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Re-grading failed.";
      setGradingResult({ success: false, message });
    } finally {
      setRegradeLoading(false);
      setRegradeTarget(null);
    }
  }, [regradeTarget, reGradeSubmission, fetchData]);

  /**
   * Open regrading request modal for a submission.
   */
  const openRegradingModal = useCallback(async (submission: SubmissionResponse, studentName: string) => {
    setRegradingModal({ isOpen: true, submission, studentName });
    setRegradingRequest(null);
    setRegradingImageUrls([]);
    setLecturerNote("");

    // Fetch regrading request for this submission
    if (submission.regradingRequestId) {
      const requests = await getBySubmissionId(submission.id);
      if (requests.length > 0) {
        const req = requests[0];
        setRegradingRequest(req);
        setLecturerNote(req.lecturerNote || "");

        // Convert S3 filenames to presigned URLs
        if (req.imageUrls && req.imageUrls.length > 0) {
          const urls: string[] = [];
          for (const filename of req.imageUrls) {
            try {
              const presignedUrl = await getFileUrl(filename);
              urls.push(presignedUrl);
            } catch {
              urls.push(filename);
            }
          }
          setRegradingImageUrls(urls);
        }
      }
    }
  }, [getBySubmissionId, getFileUrl]);

  /**
   * Close regrading request modal.
   */
  const closeRegradingModal = useCallback(() => {
    setRegradingModal(null);
    setRegradingRequest(null);
    setRegradingImageUrls([]);
    setLecturerNote("");
  }, []);

  /**
   * Handle approve/reject regrading request.
   */
  const handleRegradingAction = useCallback(async (action: "approve" | "reject") => {
    if (!regradingModal?.submission?.regradingRequestId) return;
    if (!lecturerNote.trim()) {
      setWarningModal({ isOpen: true, message: "Please enter a note for the student." });
      return;
    }

    setHandleLoading(true);
    try {
      let success = false;
      if (action === "approve") {
        success = await approve(regradingModal.submission.regradingRequestId, { lecturerNote: lecturerNote.trim() });
      } else {
        success = await reject(regradingModal.submission.regradingRequestId, { lecturerNote: lecturerNote.trim() });
      }

      if (success) {
        alert(action === "approve" ? "Regrading request approved!" : "Regrading request rejected!");
        closeRegradingModal();
        void fetchData();
      }
    } catch (err) {
      console.error("Failed to handle regrading request:", err);
      alert("Failed to process request. Please try again.");
    } finally {
      setHandleLoading(false);
    }
  }, [regradingModal, lecturerNote, approve, reject, closeRegradingModal, fetchData]);

  /**
   * Handle send batch academic warnings (level 1) for students below threshold.
   */
  const handleSendAcademicWarnings = useCallback(async () => {
    if (!classId || !examId) return;
    setShowWarningModal(false);
    setSendingWarning(true);
    setWarningResult(null);
    try {
      const result = await sendBatchAcademicWarnings({
        classroomId: classId,
        examId: examId,
        warningLevel: 1,
        minScoreThreshold: 5.0,
      });
      setWarningResult({
        success: result.failedCount === 0,
        message: `Academic warnings sent: ${result.processedStudents}/${result.totalStudents} students processed.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send academic warnings.";
      setWarningResult({ success: false, message });
    } finally {
      setSendingWarning(false);
    }
  }, [classId, examId, sendBatchAcademicWarnings]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p>{error}</p>
        <Button
          color="failure"
          size="sm"
          className="mt-3 cursor-pointer"
          onClick={fetchData}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (examProblems.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          This examination has no problems. Add problems in the Problems tab
          first.
        </p>
      </div>
    );
  }

  // In-page submission detail view (replaces list when a submission is selected)
  if (detailSubmissionId) {
    return (
      <SubmissionDetail
        submissionId={detailSubmissionId}
        studentName={detailStudentName}
        onBack={() => {
          setDetailSubmissionId(null);
          setDetailStudentName(undefined);
        }}
      />
    );
  }

  return (
    <div className="">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <Label htmlFor="submission-problem-select" className="mb-1 block">
            Problem
          </Label>
          <Select
            id="submission-problem-select"
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="w-full cursor-pointer"
          >
            <option value="">All problems</option>
            {problemSubmissions.map(({ problemId, submissions }) => {
              const label = submissions[0]?.problem?.title ?? problemId;
              return (
                <option key={problemId} value={problemId}>
                  {label}
                </option>
              );
            })}
          </Select>
        </div>
        <Tooltip content="Select a problem to run auto grading">
          <DefaultCustomButton
            label="Run Auto Grading"
            size="sm"
            className="cursor-pointer"
            onClick={() => setShowGradingConfirmModal(true)}
            disabled={!selectedProblemId}
          />
        </Tooltip>
        <Tooltip content="Send Level 1 academic warnings to students below threshold">
          <DefaultCustomButton
            label="Send Warning"
            size="sm"
            className="cursor-pointer"
            onClick={() => setShowWarningModal(true)}
          />
        </Tooltip>
      </div>
      <HR />

      {gradingResult && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            gradingResult.success
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
          }`}
        >
          <p className="font-medium">{gradingResult.message}</p>
          {gradingResult.detail && gradingResult.detail.results.length > 0 && (
            <p className="mt-1 text-sm opacity-90">
              {gradingResult.detail.results.filter((r) => !r.errorMessage).length} passed,{" "}
              {gradingResult.detail.results.filter((r) => r.errorMessage).length} failed
            </p>
          )}
          <Button
            color={gradingResult.success ? "green" : "red"}
            size="xs"
            className="mt-2 cursor-pointer"
            onClick={() => setGradingResult(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {warningResult && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            warningResult.success
              ? "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <p className="font-medium">{warningResult.message}</p>
          </div>
          <Button
            color={warningResult.success ? "yellow" : "red"}
            size="xs"
            className="mt-2 cursor-pointer"
            onClick={() => setWarningResult(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {displayedProblems.map(({ problemId, mark, submissions }, index) => {
        const problemTitle = submissions[0]?.problem?.title ?? problemId;
        const currentPage = currentPageByProblem[problemId] ?? 1;
        const totalPages = Math.max(
          1,
          Math.ceil(submissions.length / SUBMISSIONS_PAGE_SIZE),
        );
        const paginatedSubmissions = submissions.slice(
          (currentPage - 1) * SUBMISSIONS_PAGE_SIZE,
          currentPage * SUBMISSIONS_PAGE_SIZE,
        );
        const onPageChange = (page: number) => {
          setCurrentPageByProblem((prev) => ({ ...prev, [problemId]: page }));
        };
        return (
          <div key={problemId}>
            {index > 0 && (
              <hr className="my-8 border-gray-200 dark:border-gray-600" />
            )}
            <section>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {problemTitle}
              </h4>
              <p className="mt-0.5 mb-4 text-xs text-gray-500 dark:text-gray-400">
                Max mark: {mark}
              </p>
              {submissions.length === 0 ? (
                <p className="rounded-lg border border-gray-200 bg-gray-50 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  No submissions yet for this problem.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table hoverable>
                      <TableHead>
                        <TableRow>
                          <TableHeadCell>Student</TableHeadCell>
                          <TableHeadCell>Version</TableHeadCell>
                          <TableHeadCell>Submitted</TableHeadCell>
                          <TableHeadCell>Score</TableHeadCell>
                          <TableHeadCell>Status</TableHeadCell>
                          <TableHeadCell>Flag</TableHeadCell>
                          <TableHeadCell>Action</TableHeadCell>
                          <TableHeadCell>
                            <span className="sr-only">Actions</span>
                          </TableHeadCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedSubmissions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium text-gray-900 dark:text-white">
                              {studentIdToName[sub.studentId] ?? sub.studentId}
                            </TableCell>
                            <TableCell>
                              <Badge color="gray" size="sm">
                                v{sub.version}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                              {formatDate(sub.submittedDate)}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {sub.finalScore}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                color={
                                  sub.status === "GRADED"
                                    ? "success"
                                    : sub.status === "PENDING"
                                      ? "warning"
                                      : "gray"
                                }
                                size="sm"
                              >
                                {sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {flagLoadingBySubmission[sub.id] ? (
                                <Badge color="gray" size="sm">Checking</Badge>
                              ) : (
                                <Badge
                                  color={
                                    submissionFlags[sub.id] === "CRITICAL"
                                      ? "failure"
                                      : submissionFlags[sub.id] === "WARNING"
                                        ? "warning"
                                        : "success"
                                  }
                                  size="sm"
                                >
                                  {submissionFlags[sub.id] === "CRITICAL"
                                    ? "Critical"
                                    : submissionFlags[sub.id] === "WARNING"
                                      ? "Warning"
                                      : "Clean"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                              {/* Re-grade single submission */}
                              <Tooltip content="Re-grade">
                                <Button
                                  size="xs"
                                  color="light"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    setRegradeTarget({
                                      submission: sub,
                                      studentName: studentIdToName[sub.studentId] ?? sub.studentId,
                                    })
                                  }
                                >
                                  <ArrowPathIcon className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                              {/* View in editor */}
                              <Tooltip content="Review in editor">
                                <Button
                                  size="xs"
                                  color="light"
                                  className="cursor-pointer"
                                  onClick={() => router.push(`/lecturer/submission/${sub.id}`)}
                                >
                                  <CommandLineIcon className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                              {/* View detail submission of student */}
                              <Tooltip content="View detail">
                                <DefaultCustomButton
                                  label=""
                                  icon={<EyeIcon className="h-4 w-4" />}
                                  size="xs"
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setDetailSubmissionId(sub.id);
                                    setDetailStudentName(studentIdToName[sub.studentId]);
                                  }}
                                />
                              </Tooltip>
                              {/* View regrading request */}
                              {sub.regradingRequestId && (
                                <Tooltip content="View regrading request">
                                  <Button
                                    size="xs"
                                    color="yellow"
                                    className="cursor-pointer"
                                    onClick={() => openRegradingModal(sub, studentIdToName[sub.studentId] ?? sub.studentId)}
                                  >
                                    <ClipboardDocumentListIcon className="h-4 w-4" />
                                  </Button>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        );
      })}

      {gradingConfirmLoading && (
        <div
          className="fixed inset-0 z-100 flex cursor-wait flex-col items-center justify-center gap-4 bg-gray-500/60 dark:bg-gray-900/70"
          aria-hidden="true"
        >
          <Spinner size="xl" color="info" />
          <p className="text-lg font-medium text-white text-center">
            Running auto grading
            <span className="inline-block w-[1.2em] text-left" aria-hidden="true">
              {".".repeat(loadingDots + 1)}
            </span>
          </p>
        </div>
      )}

      {sendingWarning && (
        <div
          className="fixed inset-0 z-100 flex cursor-wait flex-col items-center justify-center gap-4 bg-gray-500/60 dark:bg-gray-900/70"
          aria-hidden="true"
        >
          <Spinner size="xl" color="warning" />
          <p className="text-lg font-medium text-white text-center">
            Sending academic warnings
            <span className="inline-block w-[1.2em] text-left" aria-hidden="true">
              {".".repeat(loadingDots + 1)}
            </span>
          </p>
        </div>
      )}

      <ConfirmRunningGradingForProblemModal
        show={showGradingConfirmModal}
        onClose={() => setShowGradingConfirmModal(false)}
        problemId={selectedProblemId}
        problemTitle={
          problemSubmissions.find((p) => p.problemId === selectedProblemId)
            ?.submissions[0]?.problem?.title ?? selectedProblemId
        }
        onConfirm={handleRunAutoGrading}
      />

      <RegradeConfirmModal
        show={regradeTarget !== null}
        target={regradeTarget}
        loading={regradeLoading}
        onClose={() => setRegradeTarget(null)}
        onConfirm={handleRegrade}
      />

      {/* Regrading Request Modal */}
      <RegradingRequestModal
        isOpen={regradingModal?.isOpen ?? false}
        onClose={closeRegradingModal}
        submission={regradingModal?.submission ?? null}
        studentName={regradingModal?.studentName ?? ""}
        request={regradingRequest}
        imageUrls={regradingImageUrls}
        lecturerNote={lecturerNote}
        onLecturerNoteChange={setLecturerNote}
        onApprove={() => handleRegradingAction("approve")}
        onReject={() => handleRegradingAction("reject")}
        loading={handleLoading}
        warningModal={warningModal}
        setWarningModal={setWarningModal}
      />

      <WarningModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal((prev) => ({ ...prev, isOpen: false }))}
        title="Missing Note"
        message={warningModal.message}
        variant="warning"
      />

      <SendWarningConfirmModal
        show={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleSendAcademicWarnings}
      />
    </div>
  );
}

// -- confirm run auto grading for problem modal

type ConfirmRunningGradingForProblemModalProps = {
  show: boolean;
  onClose: () => void;
  problemId: string;
  problemTitle: string;
  onConfirm: () => void | Promise<void>;
};

function ConfirmRunningGradingForProblemModal({
  show,
  onClose,
  problemId,
  problemTitle,
  onConfirm,
}: ConfirmRunningGradingForProblemModalProps) {
  const handleConfirm = () => {
    void Promise.resolve(onConfirm());
  };

  return (
    <Modal show={show} onClose={onClose} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Run auto grading
        </h3>
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          Run auto grading for problem{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {problemTitle || problemId}
          </span>
          ? Pending submissions for this problem will be graded automatically.
        </p>
        <div className="flex justify-end gap-3">
          <Button color="gray" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            color="green"
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            Run auto grading
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

// -- confirm re-grade single submission modal

type RegradeConfirmModalProps = {
  show: boolean;
  target: { submission: SubmissionResponse; studentName: string } | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function RegradeConfirmModal({
  show,
  target,
  loading,
  onClose,
  onConfirm,
}: RegradeConfirmModalProps) {
  const sub = target?.submission;
  const studentName = target?.studentName ?? sub?.studentId;

  return (
    <Modal show={show} onClose={onClose} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Re-grade submission
        </h3>
        <p className="mb-2 text-gray-500 dark:text-gray-400">
          Re-grade the submission from{" "}
          <span className="font-medium text-gray-900 dark:text-white">{studentName}</span>?
        </p>
        {sub?.problem?.title && (
          <p className="mb-4 text-sm text-gray-400">
            Problem: {sub.problem.title}
          </p>
        )}
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          The submission will be re-run against hidden test cases and re-scored.
        </p>
        <div className="flex justify-end gap-3">
          <Button color="gray" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            color="green"
            onClick={() => void Promise.resolve(onConfirm())}
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? <Spinner size="sm" className="mr-2" /> : null}
            Re-grade
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

// -- modal instances rendered at SubmissionsTabContent level

interface SendWarningConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

function SendWarningConfirmModal({
  show,
  onClose,
  onConfirm,
}: SendWarningConfirmModalProps) {
  const handleConfirm = () => {
    void Promise.resolve(onConfirm());
  };

  return (
    <Modal show={show} onClose={onClose} size="md" popup>
      <ModalHeader />
      <ModalBody>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Send Academic Warnings
          </h3>
        </div>
        <p className="mb-2 text-gray-500 dark:text-gray-400">
          This will send <span className="font-medium text-yellow-600 dark:text-yellow-300">Level 1 academic warnings</span> to all students in this classroom whose exam score is below the threshold (5.0).
        </p>
        <p className="mb-6 text-sm text-gray-400 dark:text-gray-500">
          Warning Level 2 is automatically sent by the system. Use this to manually send Level 1 warnings if needed.
        </p>
        <div className="flex justify-end gap-3">
          <Button color="gray" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            color="yellow"
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            Send Warnings
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

// =============================================================================
// Regrading Request Modal for Lecturer
// =============================================================================

interface RegradingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionResponse | null;
  studentName: string;
  request: RegradingRequest | null;
  imageUrls: string[];
  lecturerNote: string;
  onLecturerNoteChange: (note: string) => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
  warningModal: { isOpen: boolean; message: string };
  setWarningModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; message: string }>>;
}

function RegradingRequestModal({
  isOpen,
  onClose,
  submission,
  studentName,
  request,
  imageUrls,
  lecturerNote,
  onLecturerNoteChange,
  onApprove,
  onReject,
  loading,
  warningModal,
  setWarningModal,
}: RegradingRequestModalProps) {
  if (!submission) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="lg" popup>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
              <ClipboardDocumentListIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Regrading Request
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Student: {studentName}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
          {/* Submission Info */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <div className="flex items-center gap-4">
              <Badge color="blue" size="sm">
                v{submission.version}
              </Badge>
              <Badge color="gray" size="sm">
                {submission.status}
              </Badge>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {submission.finalScore}
                </p>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(submission.submittedDate)}
            </span>
          </div>

          {!request ? (
            <div className="py-4 text-center text-sm text-gray-500">
              No regrading request found for this submission.
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="flex items-center gap-2">
                {request.status === "PENDING" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <ClockIcon className="h-3 w-3" />
                    Pending Review
                  </span>
                )}
                {request.status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircleIcon className="h-3 w-3" />
                    Approved
                  </span>
                )}
                {request.status === "REJECTED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    <XCircleIcon className="h-3 w-3" />
                    Rejected
                  </span>
                )}
                {request.status === "CANCELED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                    <XCircleIcon className="h-3 w-3" />
                    Canceled
                  </span>
                )}
              </div>

              {/* Student Reason */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Student&apos;s Reason
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {request.reason}
                </div>
              </div>

              {/* Proof Images */}
              {imageUrls.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proof Images ({imageUrls.length})
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {imageUrls.map((url, index) => (
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
                Submitted: {formatDate(request.createdDate)}
              </div>

              {/* Lecturer Note */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Note {request.status === "PENDING" && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  value={lecturerNote}
                  onChange={(e) => onLecturerNoteChange(e.target.value)}
                  placeholder="Enter your feedback for the student..."
                  rows={3}
                  disabled={request.status !== "PENDING"}
                />
              </div>

              {/* Lecturer Response Note (if already handled) */}
              {request.lecturerNote && request.status !== "PENDING" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Previous Response
                  </label>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                    {request.lecturerNote}
                  </div>
                </div>
              )}

              {/* Handled Date */}
              {request.handledDate && (
                <div className="text-xs text-gray-500">
                  Handled: {formatDate(request.handledDate)}
                </div>
              )}

              {/* Action Buttons - Only show for PENDING requests */}
              {request.status === "PENDING" && (
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    color="gray"
                    onClick={onClose}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    color="red"
                    onClick={onReject}
                    disabled={loading || !lecturerNote.trim()}
                    className="cursor-pointer"
                  >
                    {loading ? <Spinner size="sm" className="mr-2" /> : null}
                    Reject
                  </Button>
                  <Button
                    color="green"
                    onClick={onApprove}
                    disabled={loading || !lecturerNote.trim()}
                    className="cursor-pointer"
                  >
                    {loading ? <Spinner size="sm" className="mr-2" /> : null}
                    Approve
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

// -- modal instances at SubmissionsTabContent level
