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
} from "flowbite-react";
import {
  ArrowPathIcon,
  CommandLineIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import type { Examination } from "@/types/examination";
import type {
  SubmissionResponse,
  SubmissionGradingRequest,
  AutoGradeProblemResponse,
} from "@/types/submission";
import type { ClassroomStudentResponse } from "@/types/classroom";
import { useStudentClassroom } from "@/hooks/classroom/useStudentClassroom";
import { useSubmissionLecturer } from "@/hooks/submission/useSubmissionLecturer";
import { formatDate } from "@/utils/datetime-utils";
import { CustomPagination } from "@/components/custom-pagination";
import { DefaultCustomButton } from "@/components/ui/custom-button";
import { SubmissionDetail } from "./submission-detail";
import { useExamLog } from "@/hooks/exam/useExamLog";
import { deriveExamViolationFlag, type ExamViolationFlag } from "@/utils/exam-log-flag";

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
