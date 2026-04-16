'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodingWorkspace } from './coding-workspace';
import { useEditorContext } from '@/contexts/EditorContext';
import { ExaminationSpecificProblemResponse, Mode } from '@/types/examination';
import { useAuth } from '@/contexts/AuthContext';
import { useExamViolationGuard, type LogEntry, type ViolationOverlay } from '@/hooks/exam/useExamViolationGuard';
import { buildExamSessionStorageKeys } from '@/utils/test-tracker/examSessionKeys';
import { buildExamTrackerStorageKeys } from '@/utils/test-tracker/storageKeys';
import { WarningModal } from './warning-modal';
import { useExamLog } from '@/hooks/exam/useExamLog';
import { useStudentExamSession } from '@/hooks/exam/useStudentExamSession';
import {
  clearExamSessionClientStorage,
  mirrorExamSessionPhaseToLocalStorage,
} from '@/utils/student-exam-session';
import { useExamination } from '@/hooks/exam/useExamination';
import { useProblem } from '@/hooks/problem/useProblem';
import { useSubmissionStudent } from '@/hooks/submission/useSubmissionStudent';
import { toExamProblem } from '@/utils/exam-problem';

interface CodeEditorClientProps {
  examination: ExaminationSpecificProblemResponse;
}

const MAX_TOLERANCE = 3;
const DRAFT_SAVE_DEBOUNCE_MS = 1500;
const DRAFT_STORAGE_PREFIX = 'code-editor-draft-';

function getDraftStorageKey(problemId: string, examId: string | null): string {
  return `${DRAFT_STORAGE_PREFIX}${problemId}-${examId ?? 'practice'}`;
}

/**
 * Get the duration of the examination in minutes
 * @param startDatetime - The start datetime of the examination
 * @param endDatetime - The end datetime of the examination
 * @returns The duration of the examination in minutes
 */
function getExamDuration(startDatetime: string, endDatetime: string): number {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

export function CodeEditorClient({
  examination,
}: CodeEditorClientProps) {
  const router = useRouter();
  const { cacheExamLogs, flushCachedExamLogs } = useExamLog();
  const { getByExam, lock } = useStudentExamSession();
  const { getExaminationById } = useExamination();
  const { getProblemsByIds } = useProblem();
  const { saveSubmission } = useSubmissionStudent();
  const { user } = useAuth();
  const {
    editorState,
    setProblem,
    setExamMode,
    setTestCases,
    setLanguage,
    setCode,
    startTimer,
    setExamBackLink,
    submitCode,
    isSubmitting,
    selectedCompiler,
    incrementSubmissionsRefresh,
  } = useEditorContext();

  const problemId = examination.problem.id;
  const examId = examination.id;
  const studentId = user?.id ?? '';
  const isExamMode = examination.mode === Mode.EXAMINATION;
  const storageKeys = useMemo(
    () => (studentId ? buildExamTrackerStorageKeys(examId, problemId, studentId) : null),
    [examId, problemId, studentId]
  );
  const sessionKeys = useMemo(
    () => (studentId ? buildExamSessionStorageKeys(examId, studentId) : null),
    [examId, studentId]
  );
  const [, setLogs] = useState<LogEntry[]>([]);
  const [overlay, setOverlay] = useState<ViolationOverlay | null>(null);
  const [screen, setScreen] = useState<'intro' | 'exam' | 'end'>('intro');
  const violationCountRef = useRef(0);
  const isInitializingRef = useRef(true);
  const isReloadingRef = useRef(false);
  const isExamFinishedRef = useRef(false);
  const examStartTimeRef = useRef(0);
  const forceSubmitTriggeredRef = useRef(false);

  /** Khi bị khóa do vi phạm: nộp bài cho mọi câu trong đề (draft/template), rồi server lock. */
  const submitAllForForceSubmit = useCallback(async () => {
    const sid = user?.id;
    if (!isExamMode || !examId || !sid || !selectedCompiler) {
      await submitCode();
      return;
    }

    const fullExam = await getExaminationById(examId);
    const orderedIds = fullExam?.examProblems?.map((ep) => ep.problemId) ?? [];
    if (orderedIds.length === 0) {
      await submitCode();
      return;
    }

    const details = await getProblemsByIds(orderedIds);
    const langId = examination.programmingLanguage.id;
    const templateById = new Map(
      details.map((p) => [p.id, toExamProblem(p, examId, langId).codeTemplate])
    );
    const languageId = langId;

    for (const pid of orderedIds) {
      let source: string;
      if (pid === problemId) {
        source = editorState.code;
      } else {
        let draft: string | null = null;
        try {
          draft = typeof window !== 'undefined' ? localStorage.getItem(getDraftStorageKey(pid, examId)) : null;
        } catch {
          draft = null;
        }
        const tpl = templateById.get(pid) ?? '';
        source = draft != null && draft.trim() !== '' ? draft : tpl;
        if (!source.trim()) {
          source = tpl || '//';
        }
      }

      try {
        await saveSubmission({
          examId,
          problemId: pid,
          studentId: sid,
          source,
          languageId,
          compilerId: selectedCompiler.id,
        });
      } catch {
        // vẫn thử các câu còn lại
      }
    }

    incrementSubmissionsRefresh();
  }, [
    isExamMode,
    examId,
    user?.id,
    selectedCompiler,
    getExaminationById,
    getProblemsByIds,
    problemId,
    editorState.code,
    examination.programmingLanguage.id,
    saveSubmission,
    submitCode,
    incrementSubmissionsRefresh,
  ]);

  // Initialize from examination, then restore draft if one exists
  useEffect(() => {
    if (!examination) return;
    setProblem(examination.problem);
    setExamBackLink(examination.id, examination.classroom?.id ?? null);
    setTestCases(examination.problem.testCases);
    const template = (() => {
      const langId = examination.programmingLanguage?.id ?? '';
      const langTemplates = (examination.problem as unknown as Record<string, unknown>).codeTemplates as Record<string, string> | undefined;
      return (langId && langTemplates?.[langId]?.trim()) ??
        langTemplates?.['default']?.trim() ??
        '';
    })();
    setLanguage(examination.programmingLanguage, template);
    setCode(template);

    const key = getDraftStorageKey(problemId, examId);
    try {
      const draft = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (draft !== null && draft.trim() !== '') {
        setCode(draft);
      }
    } catch {
      // ignore localStorage errors
    }

    if (examination.endDatetime) {
      setExamMode(true, new Date(examination.endDatetime));
      startTimer();
    }
  }, [examination, setProblem, setExamMode, setTestCases, setLanguage, setCode, startTimer, setExamBackLink, problemId, examId]);

  useEffect(() => {
    if (!isExamMode || !storageKeys) return;
    examStartTimeRef.current = Date.now();
    isExamFinishedRef.current = false;
    forceSubmitTriggeredRef.current = false;
    setScreen('exam');
    isInitializingRef.current = false;
    localStorage.setItem(storageKeys.examStatusStorageKey, 'active');
    localStorage.setItem(storageKeys.answerStorageKey, '');
  }, [isExamMode, storageKeys]);

  // Debounced auto-save of code to localStorage so it survives refresh/navigation
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!problemId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    saveTimeoutRef.current = setTimeout(() => {
      const key = getDraftStorageKey(problemId, examId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, editorState.code);
        }
      } catch {
        // ignore
      }
      saveTimeoutRef.current = null;
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editorState.code, problemId, examId]);

  // Save immediately on leave/refresh so latest code is not lost
  useEffect(() => {
    if (!problemId || typeof window === 'undefined') return;
    const key = getDraftStorageKey(problemId, examId);
    const onBeforeUnload = () => {
      try {
        localStorage.setItem(key, editorState.code);
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [problemId, examId, editorState.code]);

  const handleAppendLog = useCallback(
    (
      type: string,
      severity: 'info' | 'warning' | 'critical',
      isViolation: boolean,
      message: string,
      detail: Record<string, unknown>
    ) => {
      if (!storageKeys) return;
      const entry: LogEntry = {
        time: new Date().toISOString(),
        type,
        severity,
        isViolation,
        message,
        detail,
      };
      setLogs((prev) => {
        const next = [...prev, entry];
        localStorage.setItem(storageKeys.logsStorageKey, JSON.stringify(next));
        return next;
      });
      void cacheExamLogs({
        sessionKey: storageKeys.sessionKey,
        entries: [
          {
            eventType: type,
            eventDetail: JSON.stringify(detail ?? {}),
            message,
            severity,
            isViolation,
            clientTimestamp: entry.time,
          },
        ],
      });
    },
    [cacheExamLogs, storageKeys]
  );

  useEffect(() => {
    if (!isExamMode || !sessionKeys || !storageKeys || typeof window === 'undefined') return;
    const agg = Number.parseInt(
      localStorage.getItem(sessionKeys.aggregatedViolationsStorageKey) ?? '0',
      10,
    );
    const cur = Number.parseInt(localStorage.getItem(storageKeys.violationStorageKey) ?? '0', 10);
    const merged =
      Number.isFinite(agg) && Number.isFinite(cur) ? Math.max(agg, cur) : cur;
    if (merged > cur) {
      localStorage.setItem(storageKeys.violationStorageKey, String(merged));
    }
    violationCountRef.current = merged;
  }, [isExamMode, sessionKeys, storageKeys]);

  useExamViolationGuard({
    examStatusStorageKey: storageKeys?.examStatusStorageKey ?? '',
    violationStorageKey: storageKeys?.violationStorageKey ?? '',
    logsStorageKey: storageKeys?.logsStorageKey ?? '',
    answerStorageKey: storageKeys?.answerStorageKey ?? '',
    maxTolerance: MAX_TOLERANCE,
    answer: editorState.code,
    violationCountRef,
    isInitializingRef,
    isReloadingRef,
    isExamFinishedRef,
    examStartTimeRef,
    setAnswer: setCode,
    setLogs,
    setScreen,
    setOverlay,
    onLog: handleAppendLog,
    onForceSubmit: async () => {
      if (forceSubmitTriggeredRef.current || isSubmitting) return;
      forceSubmitTriggeredRef.current = true;
      try {
        await submitAllForForceSubmit();
      } catch (err) {
        console.error('Force submit all problems failed:', err);
        await submitCode();
      }
      try {
        await lock(examId, 'Violation threshold exceeded');
      } catch {
        // session may already be locked server-side
      }
      clearExamSessionClientStorage(examId, studentId);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }
      const classroomId = examination.classroom?.id;
      if (classroomId) {
        router.push(`/my-classroom/${classroomId}/exam/${examId}`);
      }
    },
  });

  useEffect(() => {
    if (!isExamMode || !sessionKeys || !studentId) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await getByExam(examId);
        if (cancelled) return;
        if (s?.phase === 'ACTIVE') {
          if (sessionKeys) {
            mirrorExamSessionPhaseToLocalStorage(
              sessionKeys,
              'ACTIVE',
              examination.classroom?.id ?? null,
            );
          }
          return;
        }
        clearExamSessionClientStorage(examId, studentId);
        const classroomId = examination.classroom?.id;
        if (classroomId) router.replace(`/my-classroom/${classroomId}/exam/${examId}`);
      } catch {
        const classroomId = examination.classroom?.id;
        if (!cancelled && classroomId) router.replace(`/my-classroom/${classroomId}/exam/${examId}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, examination.classroom?.id, getByExam, isExamMode, router, sessionKeys, studentId]);

  useEffect(() => {
    if (!storageKeys) return;
    localStorage.setItem(storageKeys.answerStorageKey, editorState.code);
  }, [editorState.code, storageKeys]);

  useEffect(() => {
    if (!storageKeys) return;

    const handleLeaveProblem = async () => {
      isExamFinishedRef.current = true;
      localStorage.setItem(storageKeys.examStatusStorageKey, 'left');
      setOverlay(null);
      setScreen('end');

      const submissionId = localStorage.getItem(storageKeys.lastSubmissionIdStorageKey) ?? '';
      if (!submissionId) return;

      await flushCachedExamLogs({
        sessionKey: storageKeys.sessionKey,
        submissionId,
      });
    };

    window.addEventListener('exam:leave-problem', handleLeaveProblem as EventListener);
    return () => {
      window.removeEventListener('exam:leave-problem', handleLeaveProblem as EventListener);
    };
  }, [flushCachedExamLogs, storageKeys]);

  const handleCloseOverlay = useCallback(async () => {
    if (sessionKeys) {
      const phase = localStorage.getItem(sessionKeys.phaseStorageKey);
      if (phase === 'active' && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // ignore; browser may block without user gesture
        }
      }
    }
    window.dispatchEvent(new CustomEvent('exam:reset-clipboard'));
    setOverlay(null);
  }, [sessionKeys]);

  return (
    <>
      <CodingWorkspace />
      <WarningModal
        isOpen={overlay !== null && screen === 'exam'}
        onClose={() => {
          void handleCloseOverlay();
        }}
        title={overlay?.title ?? 'Exam warning'}
        message={[overlay?.msg, overlay?.sub].filter(Boolean).join(' ')}
        alertType={overlay?.alertType}
        variant="info"
      />
    </>
  );
}
