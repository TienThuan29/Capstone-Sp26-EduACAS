"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Tabs,
  TabItem,
  Label,
  Select,
} from "flowbite-react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { ExamLogResponse, SubmissionResponse, TestResultResponse } from "@/types/submission";
import { useSubmission } from "@/hooks/submission/useSubmission";
import { useExamLog } from "@/hooks/exam/useExamLog";
import { formatDate, formatGradedDate } from "@/utils/datetime-utils";
import { deriveExamViolationFlag } from "@/utils/exam-log-flag";

export type SubmissionDetailProps = {
  submissionId: string;
  /** Fallback when API does not return student info (e.g. from list context). */
  studentName?: string;
  onBack: () => void;
};

function TestResultsTable({ results }: { results: TestResultResponse[] }) {
  const statusColor = (status: string) =>
    status === "SUCCESS"
      ? "success"
      : status === "FAIL"
        ? "failure"
        : status === "COMPILE_ERROR" || status === "RUNTIME_ERROR"
          ? "failure"
          : "warning";

  return (
    <div className="overflow-x-auto">
      <Table hoverable>
        <TableHead>
          <TableRow>
            <TableHeadCell>#</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Input</TableHeadCell>
            <TableHeadCell>Expected</TableHeadCell>
            <TableHeadCell>Actual</TableHeadCell>
            <TableHeadCell>Time (ms)</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r, i) => (
            <TableRow key={r.id ?? i}>
              <TableCell className="font-medium">{i + 1}</TableCell>
              <TableCell>
                <Badge color={statusColor(r.status)} size="sm">
                  {r.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[120px] truncate font-mono text-xs" title={r.input}>
                {r.input || "—"}
              </TableCell>
              <TableCell className="max-w-[120px] truncate font-mono text-xs" title={r.expectedOutput}>
                {r.expectedOutput || "—"}
              </TableCell>
              <TableCell className="max-w-[120px] truncate font-mono text-xs" title={r.actualOutput}>
                {r.actualOutput ?? "—"}
              </TableCell>
              <TableCell>{r.executionTimeMs ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SubmissionDetail({
  submissionId,
  studentName,
  onBack,
}: SubmissionDetailProps) {
  const { getSubmissionById } = useSubmission();
  const { getExamLogsBySubmission } = useExamLog();
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [examLogs, setExamLogs] = useState<ExamLogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<"all" | "info" | "warning" | "critical">("all");
  const [violationFilter, setViolationFilter] = useState<"all" | "only_violation" | "only_non_violation">("all");

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubmissionById(submissionId);
      setSubmission(data ?? null);
      if (!data) setError("Submission not found.");
    } catch (err) {
      console.error("Failed to load submission", err);
      setError("Failed to load submission.");
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [submissionId, getSubmissionById]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  useEffect(() => {
    let cancelled = false;
    setLogsLoading(true);
    void (async () => {
      try {
        const logs = await getExamLogsBySubmission(submissionId);
        if (!cancelled) {
          setExamLogs(logs);
        }
      } catch {
        if (!cancelled) {
          setExamLogs([]);
        }
      } finally {
        if (!cancelled) {
          setLogsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getExamLogsBySubmission, submissionId]);

  const results = submission?.testResults ?? [];
  const filteredExamLogs = examLogs.filter((log) => {
    const normalizedSeverity = String(log.severity).toLowerCase();
    const passSeverity = severityFilter === "all" || normalizedSeverity === severityFilter;
    const passViolation =
      violationFilter === "all"
      || (violationFilter === "only_violation" && log.isViolation)
      || (violationFilter === "only_non_violation" && !log.isViolation);
    return passSeverity && passViolation;
  });
  const violationFlag = deriveExamViolationFlag(examLogs);
  const flagColor =
    violationFlag === "CRITICAL"
      ? "failure"
      : violationFlag === "WARNING"
        ? "warning"
        : "success";

  return (
    <div className=" border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-600">
        <Button
          color="gray"
          outline
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to submissions
        </Button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Submission detail
          {submission && (
            <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
              · {submission.problem?.title ?? submission.problemId} · v{submission.version}
            </span>
          )}
        </h3>
        <Badge color={flagColor} size="sm">
          {violationFlag === "CLEAN" ? "Clean" : violationFlag === "WARNING" ? "Warning" : "Critical"}
        </Badge>
      </div>
      <div className="p-4 [&_button[role=tab]]:cursor-pointer">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="xl" />
          </div>
        )}
        {error && !loading && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        {submission && !loading && (
          <div className="space-y-6">
            <section>
              <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Summary
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                {submission.student ? (
                  <>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Student</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {submission.student.fullname || submission.studentId}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {submission.student.email || "—"}
                      </p>
                    </div>
                    {submission.student.roleNumber && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Role number</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {submission.student.roleNumber}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Student</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {studentName ?? submission.studentId}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Problem</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {submission.problem?.title ?? submission.problemId}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Submitted</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(submission.submittedDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Graded</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatGradedDate(submission.gradedDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Score</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {submission.finalScore}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <p>
                    <Badge
                      color={
                        submission.status === "GRADED"
                          ? "success"
                          : submission.status === "PENDING"
                            ? "warning"
                            : "gray"
                      }
                      size="sm"
                    >
                      {submission.status}
                    </Badge>
                  </p>
                </div>
              </div>
            </section>

            <Tabs>
              <TabItem title="Source code" active>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100 [word-break:break-word]">
                    {submission.source ?? "No source."}
                  </pre>
                </div>
              </TabItem>
              <TabItem title={`Test results (${results.length})`}>
                {results.length === 0 ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                    No test results for this submission.
                  </p>
                ) : (
                  <TestResultsTable results={results} />
                )}
              </TabItem>
              <TabItem title={`Violation logs (${examLogs.length})`}>
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : examLogs.length === 0 ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                    No exam logs found for this submission.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="log-severity-filter" className="mb-1 block">
                          Severity
                        </Label>
                        <Select
                          id="log-severity-filter"
                          value={severityFilter}
                          onChange={(e) => setSeverityFilter(e.target.value as "all" | "info" | "warning" | "critical")}
                        >
                          <option value="all">All</option>
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="log-violation-filter" className="mb-1 block">
                          Violation
                        </Label>
                        <Select
                          id="log-violation-filter"
                          value={violationFilter}
                          onChange={(e) => setViolationFilter(e.target.value as "all" | "only_violation" | "only_non_violation")}
                        >
                          <option value="all">All</option>
                          <option value="only_violation">Only violations</option>
                          <option value="only_non_violation">Only non-violations</option>
                        </Select>
                      </div>
                    </div>

                    {filteredExamLogs.length === 0 ? (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                        No logs match current filters.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                    <Table hoverable>
                      <TableHead>
                        <TableRow>
                          <TableHeadCell>Time</TableHeadCell>
                          <TableHeadCell>Type</TableHeadCell>
                          <TableHeadCell>Severity</TableHeadCell>
                          <TableHeadCell>Violation</TableHeadCell>
                          <TableHeadCell>Message</TableHeadCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...filteredExamLogs]
                          .sort((a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime())
                          .map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap">
                                {formatDate(log.clientTimestamp)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{log.eventType}</TableCell>
                              <TableCell>
                                <Badge
                                  color={
                                    String(log.severity).toLowerCase() === "critical"
                                      ? "failure"
                                      : String(log.severity).toLowerCase() === "warning"
                                        ? "warning"
                                        : "info"
                                  }
                                  size="sm"
                                >
                                  {String(log.severity).toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge color={log.isViolation ? "failure" : "success"} size="sm">
                                  {log.isViolation ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[480px] whitespace-pre-wrap wrap-break-word">
                                {log.message}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                      </div>
                    )}
                  </div>
                )}
              </TabItem>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
