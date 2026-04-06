'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ExamSessionGuard } from '@/components/test-tracker/exam-session-guard';
import {
  EXAM_SESSION_SYNC_EVENT,
  isAllowedExamRouteForContext,
  readExamActiveClientContext,
} from '@/utils/student-exam-session';
import { buildExamSessionStorageKeys } from '@/utils/test-tracker/examSessionKeys';

/**
 * While the student has an ACTIVE exam mirrored in localStorage but navigates outside
 * the exam page / exam code editor, keep tab/fullscreen violation detection running
 * (e.g. gate modal open, or loading gap after F5 on another route).
 */
function GlobalDisallowedRouteExamGuardInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const { user } = useAuth();
  const [, setTick] = useState(0);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(EXAM_SESSION_SYNC_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(EXAM_SESSION_SYNC_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, [bump]);

  if (user?.role !== 'STUDENT' || !user.id) return null;

  const ctx = readExamActiveClientContext();
  if (!ctx || ctx.studentId !== user.id) return null;

  if (isAllowedExamRouteForContext(ctx, pathname, search)) return null;

  const keys = buildExamSessionStorageKeys(ctx.examId, ctx.studentId);
  const phase = localStorage.getItem(keys.phaseStorageKey);
  if (phase !== 'active') return null;

  return (
    <ExamSessionGuard
      examId={ctx.examId}
      classroomId={ctx.classroomId || null}
      showOverlay={true}
      serverPhase={null}
    />
  );
}

export function GlobalDisallowedRouteExamGuard() {
  return (
    <Suspense fallback={null}>
      <GlobalDisallowedRouteExamGuardInner />
    </Suspense>
  );
}
