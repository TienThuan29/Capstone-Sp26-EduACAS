"use client";

import { useEffect, useMemo, useRef, useState, Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Spinner,
  Badge,
  HR,
  Button,
} from "flowbite-react";
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckIcon,
  ChartBarIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "@/components/sidebar";
import { ClassroomInfoBar } from "@/components/ClassroomInfoBar";
import { useExamination } from "@/hooks/examination/useExamination";
import { useProblem } from "@/hooks/problem/useProblem";
import { useClassroom } from "@/hooks/classroom/useClassroom";
import type { Examination, Problem, ExaminationMode } from "@/types/examination";
import type { Classroom } from "@/types/classroom";
import { DefaultOutlineCustomButton } from "@/components/ui/custom-button";
import { CustomPagination } from "@/components/custom-pagination";
import { normalizeDifficulty } from "@/types/problem";
import { formatDate, formatDurationMs } from "@/utils/datetime-utils";
import { toExamProblem } from "@/utils/exam-problem";
import { useAuth } from "@/contexts/AuthContext";
import { buildExamSessionStorageKeys } from "@/utils/test-tracker/examSessionKeys";
import {
  consumeExamLockedNotice,
  clearExamSessionClientStorage,
  dispatchExamActiveProblemChanged,
  EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY,
  mapServerPhaseToLocal,
  mirrorExamSessionPhaseToLocalStorage,
} from "@/utils/student-exam-session";
import { requestClipboardWritePermission } from "@/hooks/examination/useExamViolationGuard";
import { ExamSessionGuard } from "@/components/test-tracker/exam-session-guard";
import { useStudentExamSession } from "@/hooks/examination/useStudentExamSession";
import type { StudentExamSessionDto } from "@/types/student-exam-session";
import { ConfirmModal } from "@/app/code-editor/components/confirm-modal";
import { useSubmissionStudent } from "@/hooks/submission/useSubmissionStudent";
import { useExamLog } from "@/hooks/examination/useExamLog";
import { buildExamTrackerStorageKeys } from "@/utils/test-tracker/storageKeys";
import { ProblemScoreProgressChart } from "@/components/classroom-dashboard/charts/ProblemScoreProgressChart";
import type { SubmissionResponse } from "@/types/submission";

const PROBLEMS_PER_PAGE = 5;

const MODE_LABELS: Record<ExaminationMode, string> = {
  PRACTICAL: "PRACTICAL",
  EXAMINATION: "EXAMINATION",
};

function ExamDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getExaminationById } = useExamination();
  const { getProblemsByIds } = useProblem();
  const { getLatestSubmissionsByExam, getVersionsByStudentExamProblem } = useSubmissionStudent();
  const { getClassroomById } = useClassroom();
  const { flushCachedExamLogs } = useExamLog();
  const { getByExam, start, complete, setActiveProblem } = useStudentExamSession();

  const classId = params.id as string;
  const examId = params.examId as string;
  const studentId = user?.id ?? "";
  const sessionKeys = useMemo(
    () => (examId && studentId ? buildExamSessionStorageKeys(examId, studentId) : null),
    [examId, studentId],
  );

  const [examination, setExamination] = useState<Examination | null>(null);
  const [problems, setProblems] = useState<(Problem & { mark: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemsPage, setProblemsPage] = useState(1);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showClipboardPermissionModal, setShowClipboardPermissionModal] = useState(false);
  const [pendingSolveProblemId, setPendingSolveProblemId] = useState<string | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showLockedNoticeModal, setShowLockedNoticeModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const autoFinishTriggeredRef = useRef(false);
  const [serverSession, setServerSession] = useState<StudentExamSessionDto | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showFullscreenResumeModal, setShowFullscreenResumeModal] = useState(false);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [activeTab, setActiveTab] = useState<"problems" | "progress">("problems");
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [problemSubmissions, setProblemSubmissions] = useState<SubmissionResponse[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  const sessionPhase = mapServerPhaseToLocal(serverSession?.phase);
  const isSessionActive = sessionPhase === "active";
  const isSessionLocked = sessionPhase === "locked";
  const isSessionCompleted = sessionPhase === "completed";
  const isSessionEnded = isSessionLocked || isSessionCompleted;
  const shouldHideNavigationUi = isSessionActive;
  const shouldHideSidebar = isSessionActive;

  /**
   * Check if the exam mode is EXAMINATION and useStrict is true.
   * The backend uses JsonStringEnumConverter, so mode is serialized as "EXAMINATION" (string).
   */
  const isExamMode = examination?.mode === "EXAMINATION" && examination?.useStrict === true;

  const problemsTotalPages = Math.max(1, Math.ceil(problems.length / PROBLEMS_PER_PAGE));
  const currentProblemsPage = Math.min(Math.max(1, problemsPage), problemsTotalPages);
  const paginatedProblems = problems.slice(
    (currentProblemsPage - 1) * PROBLEMS_PER_PAGE,
    currentProblemsPage * PROBLEMS_PER_PAGE,
  );

  useEffect(() => {
    const fetchExamination = async () => {
      try {
        setLoading(true);
        const data = await getExaminationById(examId);
        if (data) {
          setExamination(data);
          const classroomData = await getClassroomById(classId);
          if (classroomData) setClassroom(classroomData);
        }
      } catch (error) {
        console.error("Failed to fetch examination:", error);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamination();
    }
  }, [examId, getExaminationById, getClassroomById, classId]);

  useEffect(() => {
    setShowFullscreenResumeModal(false);
  }, [examId]);

  useEffect(() => {
    if (!examId || !studentId) return;
    if (examination === null) return;
    let cancelled = false;
    setSessionLoading(true);
    void (async () => {
      try {
        const s = await getByExam(examId);
        if (cancelled) return;
        setServerSession(s);
        if (sessionKeys) {
          if (s?.phase === "ACTIVE") {
            mirrorExamSessionPhaseToLocalStorage(sessionKeys, "ACTIVE", classId);
          } else if (!s || s.phase === "NOTSTARTED") {
            mirrorExamSessionPhaseToLocalStorage(sessionKeys, null, classId);
          }
        }
      } catch (error) {
        console.error("Failed to load exam session:", error);
        if (!cancelled) setServerSession(null);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, examId, studentId, examination?.id, getByExam, sessionKeys]);

  useEffect(() => {
    const fetchProblems = async () => {
      if (!examination?.examProblems || examination.examProblems.length === 0) {
        setProblems([]);
        return;
      }

      setProblemsLoading(true);
      try {
        const problemIds = examination.examProblems.map((ep) => ep.problemId);
        const problemDetails = await getProblemsByIds(problemIds);
        const orderMap = new Map(
          examination.examProblems.map((ep, i) => [ep.problemId, i]),
        );
        const markByProblemId = new Map(
          examination.examProblems.map((ep) => [ep.problemId, ep.mark]),
        );
        const sorted = [...problemDetails].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
        const ordered = sorted
          .map((resp) => {
            const problem = toExamProblem(
              resp,
              examination.id,
              examination.programmingLanguage?.id,
            );
            const mark = markByProblemId.get(resp.id) ?? 0;
            return { ...problem, mark };
          })
          .filter((p): p is Problem & { mark: number } => p != null);
        setProblems(ordered);
        setProblemsPage(1);
      } catch (error) {
        console.error("Failed to fetch problems:", error);
      } finally {
        setProblemsLoading(false);
      }
    };

    fetchProblems();
  }, [examination?.id, examination?.examProblems, examination?.programmingLanguage?.id, getProblemsByIds]);

  const finalizeSession = useCallback(async (targetPhase: "locked" | "completed") => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      if (targetPhase === "completed") {
        const updated = await complete(examId);
        setServerSession(
          updated ?? {
            id: "",
            studentId,
            studentName: "",
            studentRoleNumber: "",
            examId,
            classroomId: "",
            phase: "COMPLETED" as const,
            activeProblemId: null,
            lockReason: null,
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
          },
        );
      }
      const latest = await getLatestSubmissionsByExam(examId);
      const byProblem = new Map(latest.map((p) => [p.problemId, p.submissions]));
      const examSessionKeys = buildExamSessionStorageKeys(examId, studentId);
      for (const [pid, subs] of byProblem.entries()) {
        const mine = subs.find((s) => s.studentId === studentId);
        if (!mine?.id) continue;
        // Use per-problem cache key (with problemId) to match the key used during caching,
        // so each problem's logs are flushed with its own submissionId.
        const logCacheKey = examSessionKeys.buildPerProblemLogKey(pid);
        try {
          await flushCachedExamLogs({ sessionKey: logCacheKey, submissionId: mine.id });
        } catch (err) {
          // Best-effort flush; don't block finalize/cleanup due to logging network issues.
          console.warn("flushCachedExamLogs failed:", err);
        }
      }
      clearExamSessionClientStorage(examId, studentId);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          /* ignore */
        }
      }
      if (targetPhase === "locked") {
        const refreshed = await getByExam(examId);
        setServerSession(refreshed);
      }
    } finally {
      setIsFinishing(false);
      setShowFinishModal(false);
    }
  }, [
    classId,
    complete,
    examId,
    flushCachedExamLogs,
    getByExam,
    getLatestSubmissionsByExam,
    isFinishing,
    studentId,
  ]);

  useEffect(() => {
    if (!isSessionLocked || autoFinishTriggeredRef.current) return;
    autoFinishTriggeredRef.current = true;
    void finalizeSession("locked").catch((err) => {
      console.error("finalizeSession(lock) failed:", err);
    });
  }, [finalizeSession, isSessionLocked]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!examination || examination.mode !== "EXAMINATION" || !isSessionActive || !examination.useStrict) return;
    try {
      const pending = sessionStorage.getItem(EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY);
      if (pending !== examId) return;
      sessionStorage.removeItem(EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY);
      if (document.fullscreenElement) return;
      setShowFullscreenResumeModal(true);
    } catch {
      /* ignore */
    }
  }, [examId, examination?.id, examination?.mode, isSessionActive, examination?.useStrict]);

  useEffect(() => {
    if (!isSessionLocked) return;
    if (consumeExamLockedNotice(examId)) {
      setShowLockedNoticeModal(true);
    }
  }, [examId, isSessionLocked]);

  // Fetch submission versions when a problem is selected in Progress tab
  useEffect(() => {
    if (!selectedProblemId || !examId || !studentId || activeTab !== "progress") return;

    let cancelled = false;
    setSubmissionsLoading(true);
    setSubmissionsError(null);

    void (async () => {
      try {
        const data = await getVersionsByStudentExamProblem(examId, selectedProblemId, studentId);
        if (!cancelled) setProblemSubmissions(data);
      } catch (err) {
        if (!cancelled) setSubmissionsError("Failed to load submission history.");
      } finally {
        if (!cancelled) setSubmissionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProblemId, examId, studentId, activeTab, getVersionsByStudentExamProblem]);

  // Auto-select the first problem when switching to progress tab
  useEffect(() => {
    if (activeTab === "progress" && !selectedProblemId && problems.length > 0) {
      setSelectedProblemId(problems[0].id);
    }
  }, [activeTab, selectedProblemId, problems]);

  // Render ExamSessionGuard early so violation detection runs even during loading.
  const earlyGuard = sessionKeys && isExamMode ? (
    <ExamSessionGuard
      examId={examId}
      classroomId={classId}
      showOverlay={true}
      serverPhase={serverSession?.phase ?? null}
    />
  ) : null;

  if (loading || (examination?.mode === "EXAMINATION" && sessionLoading)) {
    return (
      <div className="flex min-h-screen">
        {!shouldHideSidebar && <Sidebar />}
        <div className="ml-20 flex grow items-center justify-center bg-gray-50 lg:ml-64 dark:bg-gray-900">
          <Spinner size="xl" color="info" />
        </div>
        {earlyGuard}
      </div>
    );
  }

  if (!examination) {
    return (
      <div className="flex min-h-screen">
        {!shouldHideSidebar && <Sidebar />}
        <div className="container mx-auto ml-20 flex grow flex-col items-center justify-center bg-gray-50 px-4 pt-24 pb-8 lg:ml-64 dark:bg-gray-900">
          <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-300">
            Examination not found
          </h2>
          <DefaultOutlineCustomButton
            label="Go Back"
            onClick={() => router.back()}
          />
        </div>
      </div>
    );
  }

  const startDate = new Date(examination.startDatetime);
  const endDate = new Date(examination.endDatetime);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationStr = formatDurationMs(durationMs);
  const modeLabel = MODE_LABELS[examination.mode] ?? "PRACTICAL";

  const isUpcoming = startDate > new Date();
  const isExpired = endDate < new Date();
  const isActive = !isUpcoming && !isExpired;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {!shouldHideSidebar && <Sidebar />}

      <div className="ml-20 grow p-4 lg:ml-64 lg:p-8">
        {/* Back button + ClassroomInfoBar */}
        {!shouldHideNavigationUi && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <DefaultOutlineCustomButton
            label={examination?.mode === "PRACTICAL" ? "Back to Practise" : "Back to Exams"}
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push(`/my-classroom/${classId}?tab=${examination?.mode === "PRACTICAL" ? "practise" : "exams"}`)}
            className="group inline-flex w-fit cursor-pointer items-center gap-3 border border-gray-200 px-6 py-2.5 text-sm font-bold text-[#1F4E79] hover:border-[#1F4E79] hover:bg-[#1F4E79] hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-[#C9A24D] dark:hover:border-[#C9A24D] dark:hover:bg-[#C9A24D] dark:hover:text-gray-900"
          />
          {classroom && (
            <div className="ml-auto">
              <ClassroomInfoBar classroom={classroom} compact />
            </div>
          )}
        </div>
        )}
        {/* Exam Header */}
        <div className=" bg-white p-6 dark:bg-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">
                {examination.examName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {isActive && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 uppercase">
                    Ongoing
                  </span>
                )}
                {isUpcoming && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 uppercase">
                    Upcoming
                  </span>
                )}
                {isExpired && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 uppercase">
                    Ended
                  </span>
                )}
                <Badge color="info">{modeLabel}</Badge>
                {examination.programmingLanguage && (
                  <Badge color="purple">
                    {examination.programmingLanguage?.name}
                  </Badge>
                )}
                {examination.isPublicResult && (
                  <Badge color="success">Public Result</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                {examination.totalMark} marks
              </div>
              <div className="text-sm text-gray-500">Total marks</div>
            </div>
          </div>

          {examination.mode === "EXAMINATION" && (
            <div className="mt-4 flex items-center justify-end gap-3">
              {isSessionActive || (!sessionLoading && isActive && !isSessionEnded) ? (
                <Button color="red" className="cursor-pointer" onClick={() => setShowFinishModal(true)}>
                  Finish exam
                </Button>
              ) : isSessionLocked ? (
                <Badge color="failure">Exam locked</Badge>
              ) : isSessionCompleted ? (
                <Badge color="success">Completed</Badge>
              ) : (
                <Badge color="warning">Exam not started</Badge>
              )}
            </div>
          )}

          {examination.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {examination.description}
            </p>
          )}

          {/* Time info */}
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-6 md:grid-cols-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Start
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(startDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">
                  End
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(endDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Duration
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {durationStr}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Max Attempts
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {examination.maxAttempts != null ? examination.maxAttempts : "Unlimited"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <HR className="" />

        {/* Tab Navigation — only for PRACTICAL mode */}
        {examination.mode === "PRACTICAL" && (
          <div className="mb-6 mt-2">
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("problems")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "problems"
                    ? "border-[#1F4E79] text-[#1F4E79] dark:border-[#C9A24D] dark:text-[#C9A24D]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
                Problems
              </button>
              <button
                onClick={() => {
                  setActiveTab("progress");
                  if (!selectedProblemId && problems.length > 0) {
                    setSelectedProblemId(problems[0].id);
                  }
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "progress"
                    ? "border-[#1F4E79] text-[#1F4E79] dark:border-[#C9A24D] dark:text-[#C9A24D]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <ChartBarIcon className="h-4 w-4" />
                Progress
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "problems" || examination.mode !== "PRACTICAL" ? (
          <div>
            <h2 className="mb-4 border-l-8 border-[#1F4E79] pl-4 text-2xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
              Problems ({problems.length})
            </h2>
            {problems.length > 0 && problemsTotalPages > 1 && (
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Showing {(currentProblemsPage - 1) * PROBLEMS_PER_PAGE + 1}–
                {Math.min(currentProblemsPage * PROBLEMS_PER_PAGE, problems.length)} of {problems.length}
              </p>
            )}

            {problemsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
                <span className="ml-3 text-gray-500">Loading problems...</span>
              </div>
            ) : problems.length === 0 ? (
              <div className="rounded-xs border-2 border-dashed border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="font-medium text-gray-500">
                  No problems in this examination.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedProblems.map((problem) => {
                    const normalized =
                      typeof problem.difficulty === "number"
                        ? normalizeDifficulty(problem.difficulty)
                        : (problem.difficulty as "EASY" | "MEDIUM" | "HARD");
                    const mark = problem.mark;

                    return (
                      <div
                        key={problem.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {problem.title}
                          </h3>
                          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                            {normalized}, {examination.programmingLanguage?.name ?? "Unknown"}, Max Score: {mark}
                          </p>
                          {problem.tags && problem.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {problem.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <Button
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            disabled={
                              (examination.mode === "EXAMINATION" && isSessionEnded) ||
                              (examination.mode === "PRACTICAL" && examination.status === "COMPLETED")
                            }
                            onClick={() => {
                              if (examination.mode === "EXAMINATION" && isSessionEnded) return;
                              if (examination.mode === "PRACTICAL" && examination.status === "COMPLETED") return;
                              if (examination.mode === "EXAMINATION" && !isSessionActive) {
                                // Ask clipboard permission BEFORE exam guard activates.
                                // This dialog appears outside fullscreen, so any
                                // fullscreen exit from it cannot trigger a violation strike.
                                setPendingSolveProblemId(problem.id);
                                setShowClipboardPermissionModal(true);
                                return;
                              }
                              if (sessionKeys) {
                                localStorage.setItem(sessionKeys.activeProblemIdStorageKey, problem.id);
                                dispatchExamActiveProblemChanged();
                              }
                              void setActiveProblem(examId, problem.id).catch((err) => {
                                console.warn('setActiveProblem failed while solving a problem:', err);
                              });
                              router.push(`/code-editor/${problem.id}?examId=${examId}`);
                            }}
                          >
                            Solve
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!shouldHideNavigationUi && (
                  <CustomPagination
                    currentPage={currentProblemsPage}
                    totalPages={problemsTotalPages}
                    onPageChange={setProblemsPage}
                  />
                )}
              </>
            )}
          </div>
        ) : null}

        {/* Progress Tab Content — only for PRACTICAL mode */}
        {examination.mode === "PRACTICAL" && activeTab === "progress" && (
          <div>
            <h2 className="mb-4 border-l-8 border-[#1F4E79] pl-4 text-2xl font-black text-gray-900 dark:border-[#C9A24D] dark:text-white">
              Score Progress
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              View your score progression across all submission attempts per problem.
            </p>

            {problems.length > 0 && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Problem
                </label>
                <select
                  value={selectedProblemId ?? ""}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:w-auto"
                >
                  <option value="" disabled>
                    Choose a problem...
                  </option>
                  {problems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (Max: {p.mark})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProblemId && (() => {
              const selectedProblem = problems.find((p) => p.id === selectedProblemId);
              return (
                <ProblemScoreProgressChart
                  submissions={problemSubmissions}
                  maxMark={selectedProblem?.mark ?? 0}
                  problemTitle={selectedProblem?.title ?? ""}
                  loading={submissionsLoading}
                />
              );
            })()}

            {submissionsError && !submissionsLoading && (
              <p className="mt-4 text-sm text-red-500">{submissionsError}</p>
            )}
          </div>
        )}
      </div>

      {earlyGuard}

      <ConfirmModal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false);
          setPendingSolveProblemId(null);
        }}
        onConfirm={async () => {
          setShowStartModal(false);
          const pid = pendingSolveProblemId;
          setPendingSolveProblemId(null);
          if (!pid || !sessionKeys) return;

          try {
            const started = await start(examId);
            if (!started) return;
            mirrorExamSessionPhaseToLocalStorage(sessionKeys, started.phase, classId);
            setServerSession(started);

            // Reset clipboard content. handleResetClipboard checks hasClipboardWritePermission()
            // internally — if granted it writes silently, otherwise skips. No browser prompt,
            // so no risk of fullscreen exit before guard activates.
            window.dispatchEvent(new CustomEvent("exam:reset-clipboard"));

            // Enter fullscreen — guard activates after this.
            try {
              await document.documentElement.requestFullscreen();
            } catch {
              // ignore; fullscreen requires user gesture in some browsers
            }
            dispatchExamActiveProblemChanged();
            void setActiveProblem(examId, pid).catch((err) => {
              console.warn('setActiveProblem failed after starting exam session:', err);
            });
            router.push(`/code-editor/${pid}?examId=${examId}`);
          } catch (error) {
            console.error("Failed to start exam session:", error);
          }
        }}
        title="Confirm start"
        message="You are about to start the exam. The app will enter fullscreen and enable violation monitoring."
        confirmText="Start"
        cancelText="Cancel"
        confirmVariant="green"
      />

      <ConfirmModal
        isOpen={showClipboardPermissionModal}
        onClose={() => {
          setShowClipboardPermissionModal(false);
          setPendingSolveProblemId(null);
        }}
        onConfirm={() => {
          void requestClipboardWritePermission().then((granted) => {
            if (granted) {
              // Permission granted — proceed to the Start Exam confirmation.
              // The guard is NOT active yet, so any fullscreen exit from
              // the next dialog cannot cause a false violation strike.
              setShowClipboardPermissionModal(false);
              setShowStartModal(true);
            }
            // If not granted, the modal stays open so the user can try again.
            // We deliberately do NOT clear pendingSolveProblemId.
          });
        }}
        title="Permission required"
        message="To start the exam safely, please allow clipboard access when prompted by your browser. Click 'Allow' to continue."
        confirmText="Allow"
        cancelText="Cancel"
        confirmVariant="yellow"
      />

      <ConfirmModal
        isOpen={showFullscreenResumeModal}
        onClose={() => setShowFullscreenResumeModal(false)}
        onConfirm={() => {
          void document.documentElement
            .requestFullscreen()
            .then(() => setShowFullscreenResumeModal(false))
            .catch(() => {});
        }}
        title="Enter fullscreen"
        message="To continue your exam in protected mode, please enter fullscreen."
        confirmText="Enter fullscreen"
        cancelText="Not now"
        confirmVariant="green"
      />

      <ConfirmModal
        isOpen={showLockedNoticeModal}
        onClose={() => setShowLockedNoticeModal(false)}
        onConfirm={() => setShowLockedNoticeModal(false)}
        title="Exam locked"
        message="Your exam has been locked due to violations. You were removed from the coding workspace."
        confirmText="I Understand"
        cancelText="Close"
        confirmVariant="red"
      />

      <ConfirmModal
        isOpen={showFinishModal}
        onClose={() => !isFinishing && setShowFinishModal(false)}
        onConfirm={async () => {
          await finalizeSession("completed");
        }}
        title="Confirm finish"
        message="After you finish, you cannot continue the exam and violation logs will be saved."
        confirmText={isFinishing ? "Finishing..." : "Finish"}
        cancelText="Cancel"
        confirmVariant="red"
      />
    </div>
  );
}

export default function ExamDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ExamDetailContent />
    </Suspense>
  );
}
