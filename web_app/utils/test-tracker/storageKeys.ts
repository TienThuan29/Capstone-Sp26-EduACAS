export type ExamTrackerStorageKeys = {
  sessionKey: string;
  examStatusStorageKey: string;
  violationStorageKey: string;
  logsStorageKey: string;
  answerStorageKey: string;
  lastSubmissionIdStorageKey: string;
};

export function buildExamTrackerStorageKeys(
  examId: string,
  problemId: string,
  studentId: string
): ExamTrackerStorageKeys {
  const prefix = `exam-tracker:${examId}:${problemId}:${studentId}`;
  return {
    sessionKey: prefix,
    examStatusStorageKey: `${prefix}:status`,
    violationStorageKey: `${prefix}:violations`,
    logsStorageKey: `${prefix}:logs`,
    answerStorageKey: `${prefix}:answer`,
    lastSubmissionIdStorageKey: `${prefix}:last-submission-id`,
  };
}
