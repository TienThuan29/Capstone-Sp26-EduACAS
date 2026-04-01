import type { StudentExamSessionPhase } from '@/types/student-exam-session';
import {
  buildExamSessionStorageKeys,
  type ExamSessionStorageKeys,
  type ExamSessionPhase,
} from '@/utils/test-tracker/examSessionKeys';

const CODE_EDITOR_DRAFT_PREFIX = 'code-editor-draft-';

export function mapServerPhaseToLocal(
  phase: StudentExamSessionPhase | null | undefined
): ExamSessionPhase {
  switch (phase) {
    case 'ACTIVE':
      return 'active';
    case 'LOCKED':
      return 'locked';
    case 'COMPLETED':
      return 'completed';
    case 'NOTSTARTED':
    default:
      return 'verify';
  }
}

export const EXAM_SESSION_SYNC_EVENT = 'exam-session:sync';

/** Same-tab: `active-problem-id` in localStorage changed (Solve / Start modal). */
export const EXAM_ACTIVE_PROBLEM_CHANGED_EVENT = 'exam:active-problem-changed';

export function dispatchExamSessionSync(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EXAM_SESSION_SYNC_EVENT));
}

export function dispatchExamActiveProblemChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EXAM_ACTIVE_PROBLEM_CHANGED_EVENT));
}

/** sessionStorage: exam id to request fullscreen on exam detail after resume gate (value = examId). */
export const EXAM_RESUME_FULLSCREEN_EXAM_ID_KEY = 'exam-resume-fullscreen-exam-id';

/** localStorage: JSON { examId, studentId, classroomId } while client mirrors an ACTIVE session (for global violation host). */
export const EXAM_ACTIVE_CLIENT_CONTEXT_KEY = 'exam-active-client-context';

export type ExamActiveClientContext = {
  examId: string;
  studentId: string;
  classroomId: string;
};

function clearExamActiveClientContextIfMatches(examId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(EXAM_ACTIVE_CLIENT_CONTEXT_KEY);
    if (!raw) return;
    const o = JSON.parse(raw) as ExamActiveClientContext;
    if (o?.examId === examId) {
      window.localStorage.removeItem(EXAM_ACTIVE_CLIENT_CONTEXT_KEY);
    }
  } catch {
    /* ignore */
  }
}

function persistExamActiveClientContext(
  keys: ExamSessionStorageKeys,
  classroomId: string | null | undefined
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: ExamActiveClientContext = {
      examId: keys.examId,
      studentId: keys.studentId,
      classroomId: classroomId ?? '',
    };
    window.localStorage.setItem(EXAM_ACTIVE_CLIENT_CONTEXT_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function escapeExamIdForRouteRegex(examId: string): string {
  return examId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Allowed exam detail URL for this examId, or code editor with ?examId= (same rules as ActiveExamSessionGate). */
export function isAllowedExamRouteForContext(
  ctx: Pick<ExamActiveClientContext, 'examId' | 'classroomId'>,
  pathname: string,
  search: string
): boolean {
  if (!ctx.examId) return false;
  const e = escapeExamIdForRouteRegex(ctx.examId);
  if (new RegExp(`^/my-classroom/[^/]+/exam/${e}(/|$)`).test(pathname)) return true;
  const params = new URLSearchParams(search);
  if (pathname.includes('/code-editor/') && params.get('examId') === ctx.examId) return true;
  return false;
}

export function readExamActiveClientContext(): ExamActiveClientContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(EXAM_ACTIVE_CLIENT_CONTEXT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as ExamActiveClientContext;
    if (!o?.examId || !o?.studentId) return null;
    return o;
  } catch {
    return null;
  }
}

export function mirrorExamSessionPhaseToLocalStorage(
  keys: ExamSessionStorageKeys | null,
  phase: StudentExamSessionPhase | null | undefined,
  classroomId?: string | null
): void {
  if (typeof window === 'undefined' || !keys) return;
  const local = mapServerPhaseToLocal(phase);
  if (local === 'verify') {
    window.localStorage.removeItem(keys.phaseStorageKey);
    clearExamActiveClientContextIfMatches(keys.examId);
  } else {
    window.localStorage.setItem(keys.phaseStorageKey, local);
    if (local === 'active') {
      persistExamActiveClientContext(keys, classroomId);
    } else {
      clearExamActiveClientContextIfMatches(keys.examId);
    }
  }
  dispatchExamSessionSync();
}

/** Remove exam-session keys, per-problem exam-tracker keys, and code-editor drafts for this exam after session ends. */
export function clearExamSessionClientStorage(examId: string, studentId: string): void {
  if (typeof window === 'undefined' || !examId || !studentId) return;

  const keys = buildExamSessionStorageKeys(examId, studentId);
  window.localStorage.removeItem(keys.phaseStorageKey);
  window.localStorage.removeItem(keys.activeProblemIdStorageKey);
  window.localStorage.removeItem(keys.fullscreenLockStorageKey);
  window.localStorage.removeItem(keys.sessionKey);
  window.localStorage.removeItem(keys.aggregatedViolationsStorageKey);
  window.localStorage.removeItem(keys.aggregatedLogsStorageKey);
  window.localStorage.removeItem(keys.aggregatedAnswerStorageKey);
  clearExamActiveClientContextIfMatches(examId);

  const trackerPrefix = `exam-tracker:${examId}:`;
  const trackerSuffix = `:${studentId}`;
  const draftSuffix = `-${examId}`;
  const toRemove: string[] = [];

  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith(trackerPrefix) && key.includes(trackerSuffix)) {
      toRemove.push(key);
    } else if (key.startsWith(CODE_EDITOR_DRAFT_PREFIX) && key.endsWith(draftSuffix)) {
      toRemove.push(key);
    }
  }

  toRemove.forEach((k) => window.localStorage.removeItem(k));
  dispatchExamSessionSync();
}
