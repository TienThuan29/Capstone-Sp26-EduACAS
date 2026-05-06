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
  /** Builds a Redis cache key for exam logs that includes the problemId, so each problem's logs are cached separately. */
  buildPerProblemLogKey: (problemId: string) => string;
};

export type ExamSessionPhase = 'verify' | 'active' | 'locked' | 'completed';

export function buildExamSessionStorageKeys(examId: string, studentId: string): ExamSessionStorageKeys {
  const prefix = `exam-session:${examId}:${studentId}`;
  const base: Omit<ExamSessionStorageKeys, 'buildPerProblemLogKey'> = {
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
  return {
    ...base,
    buildPerProblemLogKey: (problemId: string) => `exam-tracker:${examId}:${problemId}:${studentId}`,
  };
}

