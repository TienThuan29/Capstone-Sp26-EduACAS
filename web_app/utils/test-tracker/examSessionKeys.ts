export type ExamSessionStorageKeys = {
  examId: string;
  studentId: string;
  sessionKey: string;
  phaseStorageKey: string;
  fullscreenLockStorageKey: string;
  activeProblemIdStorageKey: string;
  aggregatedViolationsStorageKey: string;
  aggregatedLogsStorageKey: string;
  aggregatedAnswerStorageKey: string;
};

export type ExamSessionPhase = 'verify' | 'active' | 'locked' | 'completed';

export function buildExamSessionStorageKeys(examId: string, studentId: string): ExamSessionStorageKeys {
  const prefix = `exam-session:${examId}:${studentId}`;
  return {
    examId,
    studentId,
    sessionKey: prefix,
    phaseStorageKey: `${prefix}:phase`,
    fullscreenLockStorageKey: `${prefix}:fullscreen-lock`,
    activeProblemIdStorageKey: `${prefix}:active-problem-id`,
    aggregatedViolationsStorageKey: `${prefix}:violations`,
    aggregatedLogsStorageKey: `${prefix}:aggregate-logs`,
    aggregatedAnswerStorageKey: `${prefix}:aggregate-answer`,
  };
}

