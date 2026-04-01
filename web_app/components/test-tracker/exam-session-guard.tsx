'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useExamViolationGuard, type LogEntry, type ViolationOverlay } from '@/hooks/exam/useExamViolationGuard';
import { useStudentExamSession } from '@/hooks/exam/useStudentExamSession';
import { useExamLog } from '@/hooks/exam/useExamLog';
import { buildExamSessionStorageKeys } from '@/utils/test-tracker/examSessionKeys';
import { buildExamTrackerStorageKeys } from '@/utils/test-tracker/storageKeys';
import {
  EXAM_ACTIVE_PROBLEM_CHANGED_EVENT,
  EXAM_SESSION_SYNC_EVENT,
  clearExamSessionClientStorage,
} from '@/utils/student-exam-session';
import { WarningModal } from '@/app/code-editor/components/warning-modal';

type Props = {
  examId: string;
  /** Classroom route id for redirect after server lock from exam page */
  classroomId?: string | null;
  /** Optional: current problemId when inside code editor */
  problemId?: string | null;
  /** Whether to show warning overlay UI */
  showOverlay?: boolean;
  /** When set, drives session finished / screen state instead of only localStorage */
  serverPhase?: 'ACTIVE' | 'LOCKED' | 'COMPLETED' | 'NOTSTARTED' | null;
};

export function ExamSessionGuard({
  examId,
  classroomId = null,
  problemId = null,
  showOverlay = true,
  serverPhase = null,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { lock } = useStudentExamSession();
  const { cacheExamLogs } = useExamLog();
  const studentId = user?.id ?? '';

  const sessionKeys = useMemo(
    () => (examId && studentId ? buildExamSessionStorageKeys(examId, studentId) : null),
    [examId, studentId]
  );

  const [resolvedProblemId, setResolvedProblemId] = useState<string | null>(null);

  useEffect(() => {
    if (problemId) {
      setResolvedProblemId(problemId);
      return;
    }
    const read = () => {
      if (!sessionKeys || typeof window === 'undefined') {
        setResolvedProblemId(null);
        return;
      }
      setResolvedProblemId(localStorage.getItem(sessionKeys.activeProblemIdStorageKey));
    };
    read();
    window.addEventListener(EXAM_ACTIVE_PROBLEM_CHANGED_EVENT, read);
    window.addEventListener(EXAM_SESSION_SYNC_EVENT, read);
    return () => {
      window.removeEventListener(EXAM_ACTIVE_PROBLEM_CHANGED_EVENT, read);
      window.removeEventListener(EXAM_SESSION_SYNC_EVENT, read);
    };
  }, [problemId, sessionKeys]);

  const trackerKeys = useMemo(() => {
    if (!examId || !studentId || !resolvedProblemId) return null;
    return buildExamTrackerStorageKeys(examId, resolvedProblemId, studentId);
  }, [examId, resolvedProblemId, studentId]);

  const [, setLogs] = useState<LogEntry[]>([]);
  const [overlay, setOverlay] = useState<ViolationOverlay | null>(null);
  const [screen, setScreen] = useState<'intro' | 'exam' | 'end'>('intro');

  const violationCountRef = useRef(0);
  const isInitializingRef = useRef(false);
  const isReloadingRef = useRef(false);
  const isExamFinishedRef = useRef(false);
  const examStartTimeRef = useRef(0);

  const violationStorageKey = trackerKeys?.violationStorageKey ?? sessionKeys?.aggregatedViolationsStorageKey ?? '';
  const logsStorageKey = trackerKeys?.logsStorageKey ?? sessionKeys?.aggregatedLogsStorageKey ?? '';
  const answerStorageKey = trackerKeys?.answerStorageKey ?? sessionKeys?.aggregatedAnswerStorageKey ?? '';

  useEffect(() => {
    if (!sessionKeys || !trackerKeys || typeof window === 'undefined') return;
    const agg = Number.parseInt(
      localStorage.getItem(sessionKeys.aggregatedViolationsStorageKey) ?? '0',
      10,
    );
    const cur = Number.parseInt(localStorage.getItem(trackerKeys.violationStorageKey) ?? '0', 10);
    const merged = Number.isFinite(agg) && Number.isFinite(cur) ? Math.max(agg, cur) : cur;
    if (merged > cur) {
      localStorage.setItem(trackerKeys.violationStorageKey, String(merged));
      violationCountRef.current = merged;
    }
  }, [sessionKeys, trackerKeys]);

  useEffect(() => {
    if (!sessionKeys) return;
    let active = false;
    let finished = false;
    if (serverPhase != null) {
      finished = serverPhase === 'LOCKED' || serverPhase === 'COMPLETED';
      active = serverPhase === 'ACTIVE';
    } else {
      const phase = localStorage.getItem(sessionKeys.phaseStorageKey);
      finished = phase === 'locked' || phase === 'completed';
      active = phase === 'active';
    }
    isExamFinishedRef.current = finished;
    setScreen(active ? 'exam' : 'intro');
    if (active) {
      if (examStartTimeRef.current === 0) {
        examStartTimeRef.current = Date.now();
      }
    } else {
      examStartTimeRef.current = 0;
    }
  }, [sessionKeys, serverPhase]);

  const handleAppendLog = useCallback(
    (
      type: string,
      severity: 'info' | 'warning' | 'critical',
      isViolation: boolean,
      message: string,
      detail: Record<string, unknown>
    ) => {
      if (!sessionKeys) return;

      const entry: LogEntry = {
        time: new Date().toISOString(),
        type,
        severity,
        isViolation,
        message,
        detail,
      };

      const payload = {
        sessionKey: trackerKeys?.sessionKey ?? sessionKeys.sessionKey,
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
      };

      if (trackerKeys) {
        setLogs((prev) => {
          const next = [...prev, entry];
          localStorage.setItem(trackerKeys.logsStorageKey, JSON.stringify(next));
          return next;
        });
      } else if (sessionKeys) {
        setLogs((prev) => {
          const next = [...prev, entry];
          try {
            localStorage.setItem(sessionKeys.aggregatedLogsStorageKey, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
      } else {
        setLogs((prev) => [...prev, entry]);
      }

      void cacheExamLogs(payload);
    },
    [cacheExamLogs, sessionKeys, trackerKeys],
  );

  const handleForceSubmitFromExamPage = useCallback(async () => {
    try {
      await lock(examId, 'Violation threshold exceeded');
    } catch {
      // session may already be locked
    }
    if (studentId) {
      clearExamSessionClientStorage(examId, studentId);
    }
    if (classroomId) {
      router.replace(`/my-classroom/${classroomId}/exam/${examId}`);
    }
  }, [classroomId, examId, lock, router, studentId]);

  useExamViolationGuard({
    examStatusStorageKey: sessionKeys?.phaseStorageKey ?? '',
    violationStorageKey,
    logsStorageKey,
    answerStorageKey,
    maxTolerance: 3,
    answer: '',
    violationCountRef,
    isInitializingRef,
    isReloadingRef,
    isExamFinishedRef,
    examStartTimeRef,
    setAnswer: () => {},
    setLogs,
    setScreen,
    setOverlay,
    onLog: handleAppendLog,
    onForceSubmit: handleForceSubmitFromExamPage,
  });

  const handleCloseOverlay = useCallback(async () => {
    if (sessionKeys) {
      const isActive =
        serverPhase != null
          ? serverPhase === 'ACTIVE'
          : localStorage.getItem(sessionKeys.phaseStorageKey) === 'active';
      if (isActive && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // ignore; browser may block without user gesture
        }
      }
    }
    window.dispatchEvent(new CustomEvent('exam:reset-clipboard'));
    setOverlay(null);
  }, [sessionKeys, serverPhase]);

  return (
    <>
      {showOverlay && (
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
      )}
    </>
  );
}
