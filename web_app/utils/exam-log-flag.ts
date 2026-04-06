import type { ExamLogResponse } from '@/types/submission';

export type ExamViolationFlag = 'CLEAN' | 'WARNING' | 'CRITICAL';

export function deriveExamViolationFlag(logs: ExamLogResponse[]): ExamViolationFlag {
  if (!logs || logs.length === 0) return 'CLEAN';

  const violationLogs = logs.filter((log) => log.isViolation);
  if (violationLogs.length === 0) return 'CLEAN';

  const hasCritical = violationLogs.some(
    (log) =>
      String(log.severity).toLowerCase() === 'critical'
      || String(log.eventType).toUpperCase() === 'DEVTOOLS_OPEN'
  );

  return hasCritical ? 'CRITICAL' : 'WARNING';
}
