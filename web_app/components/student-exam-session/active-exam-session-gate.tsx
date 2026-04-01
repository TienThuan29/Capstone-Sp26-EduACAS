'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Modal } from 'flowbite-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentExamSession } from '@/hooks/exam/useStudentExamSession';
import type { StudentExamSessionDto } from '@/types/student-exam-session';
import {
  EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY,
  isAllowedExamRouteForContext,
} from '@/utils/student-exam-session';

function ActiveExamSessionGateInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authTokens } = useAuth();
  const { getActive } = useStudentExamSession();
  const [activeSession, setActiveSession] = useState<StudentExamSessionDto | null>(null);
  const [showModal, setShowModal] = useState(false);

  const search = searchParams.toString();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (user?.role !== 'STUDENT' || !authTokens?.accessToken) {
        setActiveSession(null);
        setShowModal(false);
        return;
      }

      try {
        const session = await getActive();
        if (cancelled) return;
        if (session == null || session.phase !== 'ACTIVE') {
          setActiveSession(null);
          setShowModal(false);
          return;
        }
        setActiveSession(session);
        setShowModal(
          !isAllowedExamRouteForContext(
            { examId: session.examId, classroomId: session.classroomId },
            pathname,
            search
          )
        );
      } catch {
        if (!cancelled) {
          setActiveSession(null);
          setShowModal(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authTokens?.accessToken, getActive, pathname, search, user?.id, user?.role]);

  const handleUnderstand = useCallback(() => {
    if (!activeSession) return;
    void document.documentElement.requestFullscreen().catch(() => {});
    try {
      sessionStorage.setItem(EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY, activeSession.examId);
    } catch {
      // ignore private mode / quota
    }
    setShowModal(false);
    router.replace(`/my-classroom/${activeSession.classroomId}/exam/${activeSession.examId}`);
  }, [activeSession, router]);

  return (
    <Modal show={showModal} onClose={() => {}} dismissible={false} size="lg">
      <div className="flex flex-col gap-4 p-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          You have an exam in progress
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You may only continue this exam on the exam page or in the code editor for this exam. Tap
          &quot;I Understand&quot; to return. If fullscreen does not stay on, the exam page will ask
          you to enter fullscreen again.
        </p>
        <div className="flex justify-end">
          <Button color="blue" onClick={handleUnderstand}>
            I Understand
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
