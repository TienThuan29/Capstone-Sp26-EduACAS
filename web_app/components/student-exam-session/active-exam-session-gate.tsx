'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Modal } from 'flowbite-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentExamSession } from '@/hooks/exam/useStudentExamSession';
import {
  readExamActiveClientContext,
  EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY,
  isAllowedExamRouteForContext,
} from '@/utils/student-exam-session';
import { buildExamSessionStorageKeys } from '@/utils/test-tracker/examSessionKeys';

type ActiveGateSession = {
  examId: string;
  classroomId: string;
};

function ActiveExamSessionGateInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authTokens } = useAuth();
  const { getActive } = useStudentExamSession();
  const [activeSession, setActiveSession] = useState<ActiveGateSession | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [countdownSec, setCountdownSec] = useState(5);

  const search = searchParams.toString();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let hasLocalActiveContext = false;
      if (user?.role !== 'STUDENT' || !user.id) {
        setActiveSession(null);
        setShowModal(false);
        return;
      }

      // Fast path: rely on mirrored localStorage context so the gate works even before tokens/API are ready.
      const ctx = readExamActiveClientContext();
      if (ctx && ctx.studentId === user.id) {
        const keys = buildExamSessionStorageKeys(ctx.examId, ctx.studentId);
        const phase = localStorage.getItem(keys.phaseStorageKey);
        if (phase === 'active') {
          hasLocalActiveContext = true;
          const isAllowed = isAllowedExamRouteForContext(
            { examId: ctx.examId, classroomId: ctx.classroomId },
            pathname,
            search,
          );
          const shouldShow = !isAllowed;
          setActiveSession({ examId: ctx.examId, classroomId: ctx.classroomId });
          setShowModal(shouldShow);
          if (shouldShow) {
            setCountdownSec(5);
          }
        } else {
          setActiveSession(null);
          setShowModal(false);
        }
      }

      // Slow path: if we have an access token, verify against server.
      if (!authTokens?.accessToken) return;

      try {
        const session = await getActive();
        if (cancelled) return;
        if (session == null || session.phase !== 'ACTIVE') {
          setActiveSession(null);
          setShowModal(false);
          return;
        }
        setActiveSession({ examId: session.examId, classroomId: session.classroomId });
        const isAllowed = isAllowedExamRouteForContext(
          { examId: session.examId, classroomId: session.classroomId },
          pathname,
          search,
        );
        const shouldShow = !isAllowed;
        setShowModal(shouldShow);
        if (shouldShow) {
          setCountdownSec(5);
        }
      } catch {
        // Non-blocking: localStorage-based gate may already be showing.
        // If no local active context exists, keep the gate closed.
        if (cancelled) return;
        if (!hasLocalActiveContext) {
          setActiveSession(null);
          setShowModal(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authTokens?.accessToken, getActive, pathname, search, user?.id, user?.role]);

  useEffect(() => {
    if (!showModal) return;
    setCountdownSec(5);
    const id = window.setInterval(() => {
      setCountdownSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [showModal]);

  const handleUnderstand = useCallback(() => {
    if (!activeSession) return;
    void document.documentElement.requestFullscreen().catch(() => {});
    try {
      sessionStorage.setItem(EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY, activeSession.examId);
    } catch {
      // ignore private mode / quota
    }
    setShowModal(false);
    // If already on an allowed exam route, don't redirect; just re-request fullscreen / resume.
    const isAllowed = isAllowedExamRouteForContext(
      { examId: activeSession.examId, classroomId: activeSession.classroomId },
      pathname,
      search,
    );
    if (!isAllowed) {
      router.replace(`/my-classroom/${activeSession.classroomId}/exam/${activeSession.examId}`);
    }
  }, [activeSession, pathname, router, search]);

  return (
    <Modal show={showModal} onClose={() => {}} dismissible={false} size="lg">
      <div className="flex flex-col gap-4 p-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          You have an exam in progress
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You navigated away from your exam. For exam integrity, you must return to the exam
          immediately. Please review the warning below and tap &quot;I Understand&quot; to continue.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          <div className="font-semibold">Warning</div>
          <div>
            Return to your exam now. This dialog will remain until you confirm. Countdown:{' '}
            <span className="font-bold tabular-nums">{countdownSec}s</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button color="blue" onClick={handleUnderstand}>
            {countdownSec > 0 ? `I Understand (${countdownSec})` : 'I Understand'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ActiveExamSessionGate() {
  return (
    <Suspense fallback={null}>
      <ActiveExamSessionGateInner />
    </Suspense>
  );
}
