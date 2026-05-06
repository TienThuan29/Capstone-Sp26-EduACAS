"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";
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
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { X } from "lucide-react";
import { CustomPagination } from "@/components/custom-pagination";
import type {
  ExamLogResponse,
  KeystrokeRecordResponse,
  SubmissionResponse,
  TestResultResponse,
} from "@/types/submission";
// import type {  SubmissionResponse, TestResultResponse } from "@/types/submission";
import { useSubmission } from "@/hooks/submission/useSubmission";
import { useExamLog } from "@/hooks/examination/useExamLog";
import { formatDate, formatGradedDate } from "@/utils/datetime-utils";
import { deriveExamViolationFlag } from "@/utils/exam-log-flag";
import { SubmissionDetailTabSkeleton } from "@/components/ui/skeletons";

interface DropdownOption {
  value: string;
  label: string;
  dotColor?: string;
  bgColor?: string;
  textColor?: string;
}

interface StyledDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  minWidth?: string;
}

function StyledDropdown({ label, options, value, onChange, minWidth = "140px" }: StyledDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-0.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        style={{ minWidth }}
      >
        {selectedOption.dotColor && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: selectedOption.dotColor }}
          />
        )}
        <span className="flex-1 text-left">{selectedOption.label}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={clsx(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                  isSelected
                    ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {opt.dotColor && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.dotColor }}
                  />
                )}
                <span className={clsx(
                  "rounded px-1.5 py-0.5 font-bold uppercase tracking-wider",
                  opt.bgColor,
                  opt.textColor
                )}>
                  {opt.label}
                </span>
                {isSelected && (
                  <svg className="ml-auto h-3.5 w-3.5 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

function KeystrokeLogsViewer({ records }: { records: KeystrokeRecordResponse[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!records || records.length === 0) {
    return null;
  }

  const selectedRecord = records[selectedIndex];

  return (
    <div className="flex flex-col md:flex-row overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="md:w-1/3 max-h-[500px] overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {records.map((record, index) => (
            <li
              key={`${record.timeStartSet}-${record.timeOffSet}-${index}`}
              className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                selectedIndex === index
                  ? "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-l-4 border-transparent"
              }`}
              onClick={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {record.timeOffSet || `Log #${index + 1}`}
                </span>
                <Badge color="gray" size="sm">
                  {record.charCount} chars
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>CPS: {record.cps}</span>
                <span>Dur: {record.duration}ms</span>
              </div>
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">
                {record.timeStartSet}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:w-2/3 max-h-[500px] overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Code Snapshot
            <span className="ml-2 font-normal text-gray-500">
              at {selectedRecord.timeOffSet}
            </span>
          </h4>
          <Badge color="info">
            Length: {selectedRecord.content?.length || 0}
          </Badge>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 [word-break:break-word]">
            {selectedRecord.content || "Empty content"}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function SubmissionDetail({
  submissionId,
  studentName,
  onBack,
}: SubmissionDetailProps) {
  const { getSubmissionById, getSubmissionVersions } = useSubmission();
  const { getExamLogsBySubmission } = useExamLog();
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [examLogs, setExamLogs] = useState<ExamLogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [violationFilter, setViolationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [versions, setVersions] = useState<SubmissionResponse[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const LOGS_PER_PAGE = 10;
  const [selectedLogDetail, setSelectedLogDetail] = useState<{ log: ExamLogResponse; parsedDetail: Record<string, unknown> } | null>(null);

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

  const fetchVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const versionList = await getSubmissionVersions(submissionId);
      setVersions(versionList);
    } catch (err) {
      console.error("Failed to load versions", err);
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  }, [submissionId, getSubmissionVersions]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    let cancelled = false;
    setLogsLoading(true);
    void (async () => {
      try {
        const idToQuery = submission?.id || submissionId;
        console.log("[DEBUG] Fetching exam logs for submissionId:", idToQuery);
        const logs = await getExamLogsBySubmission(idToQuery);
        console.log("[DEBUG] Received exam logs:", logs);
        if (!cancelled) {
          setExamLogs(logs);
          setLogsLoading(false);
        }
      } catch (err) {
        console.error("[DEBUG] Failed to fetch exam logs:", err);
        if (!cancelled) {
          setExamLogs([]);
          setLogsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [submissionId, submission?.id]);

  const results = submission?.testResults ?? [];

  // LMKhoi
  const keystrokeLogs = submission?.keystroke_logs ?? submission?.keystrokeLogs ?? [];
  const keystrokeRecords = keystrokeLogs.flatMap((log) => log.keystroke_data ?? []);

  // Tamtc
  const filteredExamLogs = examLogs.filter((log) => {
    const normalizedSeverity = String(log.severity).toLowerCase();
    const passSeverity = severityFilter === "all" || normalizedSeverity === severityFilter;
    const passViolation =
      violationFilter === "all"
      || (violationFilter === "only_violation" && log.isViolation)
      || (violationFilter === "only_non_violation" && !log.isViolation);
    const passType = typeFilter === "all" || log.eventType === typeFilter;
    return passSeverity && passViolation && passType;
  });

  // Extract unique event types for the dropdown
  const uniqueEventTypes = Array.from(new Set(examLogs.map((log) => log.eventType))).sort();

  const logTotalPages = Math.max(1, Math.ceil(filteredExamLogs.length / LOGS_PER_PAGE));
  const safeLogPage = Math.min(logPage, logTotalPages);
  const paginatedLogs = [...filteredExamLogs]
    .sort((a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime())
    .slice((safeLogPage - 1) * LOGS_PER_PAGE, safeLogPage * LOGS_PER_PAGE);
  const violationFlag = deriveExamViolationFlag(examLogs);
  const flagColor =
    violationFlag === "CRITICAL"
      ? "failure"
      : violationFlag === "WARNING"
        ? "warning"
        : "success";

  const handleVersionChange = (version: number) => {
    const selectedVersion = versions.find(v => v.version === version);
    if (selectedVersion) {
      setSubmission(selectedVersion);
    }
  };
  // ------------

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
  // ------------

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
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Submission detail
            {submission && (
              <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                · {submission.problem?.title ?? submission.problemId}
              </span>
            )}
          </h3>
          {submission && versions.length > 1 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="version-select" className="font-normal text-gray-500 dark:text-gray-400">
                Version:
              </Label>
              <Select
                id="version-select"
                value={submission.version}
                onChange={(e) => handleVersionChange(Number(e.target.value))}
                className="w-auto"
              >
                {sortedVersions.map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version}
                    {v.id === submissionId ? " (current)" : ""}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        <Badge color={flagColor} size="sm">
          {violationFlag === "CLEAN" ? "Clean" : violationFlag === "WARNING" ? "Warning" : "Critical"}
        </Badge>
      </div>
      <div className="p-4 [&_button[role=tab]]:cursor-pointer">
        {loading && (
          <SubmissionDetailTabSkeleton />
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
                  <p className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    submission.status === "GRADED"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : submission.status === "PENDING"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      submission.status === "GRADED"
                        ? "bg-emerald-500"
                        : submission.status === "PENDING"
                          ? "bg-amber-500"
                          : "bg-gray-500"
                    }`}></span>
                    {submission.status}
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
              {/* LMKhoi */}
              <TabItem title={`Keystroke Log (${keystrokeRecords.length})`}>
                {keystrokeRecords.length === 0 ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                    No keystroke logs for this submission.
                  </p>
                ) : (
                  <KeystrokeLogsViewer records={keystrokeRecords} />
                )}
              </TabItem>
              {/* Tamtc */}
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
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {filteredExamLogs.length} of {examLogs.length} logs
                      </p>
                    </div>
                    <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                      <StyledDropdown
                        label="Severity"
                        value={severityFilter}
                        onChange={(val) => { setSeverityFilter(val); setLogPage(1); }}
                        options={[
                          { value: "all", label: "All", dotColor: "#9CA3AF" },
                          { value: "info", label: "Info", dotColor: "#3B82F6", bgColor: "bg-blue-100 dark:bg-blue-900/40", textColor: "text-blue-700 dark:text-blue-400" },
                          { value: "warning", label: "Warning", dotColor: "#F59E0B", bgColor: "bg-amber-100 dark:bg-amber-900/40", textColor: "text-amber-700 dark:text-amber-400" },
                          { value: "critical", label: "Critical", dotColor: "#EF4444", bgColor: "bg-red-100 dark:bg-red-900/40", textColor: "text-red-700 dark:text-red-400" },
                        ]}
                        minWidth="140px"
                      />
                      <div className="h-8 w-px bg-gray-200 self-center dark:bg-gray-700"></div>
                      <StyledDropdown
                        label="Violation"
                        value={violationFilter}
                        onChange={(val) => { setViolationFilter(val); setLogPage(1); }}
                        options={[
                          { value: "all", label: "All", dotColor: "#9CA3AF" },
                          { value: "only_violation", label: "Violations", dotColor: "#EF4444", bgColor: "bg-red-100 dark:bg-red-900/40", textColor: "text-red-700 dark:text-red-400" },
                          { value: "only_non_violation", label: "Safe", dotColor: "#10B981", bgColor: "bg-emerald-100 dark:bg-emerald-900/40", textColor: "text-emerald-700 dark:text-emerald-400" },
                        ]}
                        minWidth="140px"
                      />
                      <div className="h-8 w-px bg-gray-200 self-center dark:bg-gray-700"></div>
                      <StyledDropdown
                        label="Type"
                        value={typeFilter}
                        onChange={(val) => { setTypeFilter(val); setLogPage(1); }}
                        options={[
                          { value: "all", label: "All Types", dotColor: "#9CA3AF" },
                          ...uniqueEventTypes.map((type) => ({ value: type, label: type, dotColor: "#6366F1" })),
                        ]}
                        minWidth="160px"
                      />
                    </div>

                    {filteredExamLogs.length === 0 ? (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                        No logs match current filters.
                      </p>
                    ) : (
                      <>
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <div className="overflow-x-auto">
                      <Table hoverable className="[&_th]:bg-gray-50 dark:[&_th]:bg-gray-900 [&_th]:border-gray-100 dark:[&_th]:border-gray-700">
                        <TableHead>
                          <TableRow className="border-b border-gray-100 dark:border-gray-700">
                            <TableHeadCell className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Time</TableHeadCell>
                            <TableHeadCell className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</TableHeadCell>
                            <TableHeadCell className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Severity</TableHeadCell>
                            <TableHeadCell className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Violation</TableHeadCell>
                            <TableHeadCell className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Message</TableHeadCell>
                            <TableHeadCell className="w-16 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Content</TableHeadCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...paginatedLogs]
                            .map((log) => {
                              let parsedDetail: Record<string, unknown> = {};
                              try {
                                parsedDetail = JSON.parse(log.eventDetail || '{}');
                              } catch { /* ignore */ }
                              return { log, parsedDetail };
                            })
                            .map(({ log, parsedDetail }) => (
                            <TableRow key={log.id} className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-gray-700/40">
                              <TableCell className="whitespace-nowrap py-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {formatDate(log.clientTimestamp).split(' ')[0]}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatDate(log.clientTimestamp).split(' ')[1] ?? ''}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {log.eventType}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                  String(log.severity).toLowerCase() === "critical"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                    : String(log.severity).toLowerCase() === "warning"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    String(log.severity).toLowerCase() === "critical"
                                      ? "bg-red-500"
                                      : String(log.severity).toLowerCase() === "warning"
                                        ? "bg-amber-500"
                                        : "bg-blue-500"
                                  }`}></span>
                                  {String(log.severity).toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                  log.isViolation
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${log.isViolation ? "bg-red-500" : "bg-emerald-500"}`}></span>
                                  {log.isViolation ? "Yes" : "No"}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-[480px] py-3">
                                <p className="truncate text-sm text-gray-700 dark:text-gray-300" title={log.message}>
                                  {log.message}
                                </p>
                              </TableCell>
                              <TableCell className="py-3">
                                {parsedDetail.content ? (
                                  <button
                                    onClick={() => setSelectedLogDetail({ log, parsedDetail })}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-all duration-200 hover:scale-105 hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/50"
                                    title="View content details"
                                  >
                                    <DocumentTextIcon className="h-3.5 w-3.5" />
                                    <span>View</span>
                                  </button>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                        </div>
                        </div>
                        {logTotalPages > 1 && (
                          <CustomPagination
                            currentPage={logPage}
                            totalPages={logTotalPages}
                            onPageChange={setLogPage}
                          />
                        )}
                      </>
                    )}

                    {selectedLogDetail && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                          onClick={() => setSelectedLogDetail(null)}
                        />
                        <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                          {/* Modal Card */}
                          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                                  <DocumentTextIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Log Detail
                                  </h3>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Event #{selectedLogDetail.log.id?.slice(0, 8) ?? '—'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedLogDetail(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto p-6 max-h-[60vh]">
                              {/* Badges Row */}
                              <div className="mb-5 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                                  {selectedLogDetail.log.eventType}
                                </span>
                                <Badge
                                  color={
                                    String(selectedLogDetail.log.severity).toLowerCase() === "critical"
                                      ? "failure"
                                      : String(selectedLogDetail.log.severity).toLowerCase() === "warning"
                                        ? "warning"
                                        : "info"
                                  }
                                >
                                  {String(selectedLogDetail.log.severity).toUpperCase()}
                                </Badge>
                                <Badge color={selectedLogDetail.log.isViolation ? "failure" : "success"}>
                                  {selectedLogDetail.log.isViolation ? "Violation" : "Non-violation"}
                                </Badge>
                              </div>

                              {/* Meta Grid */}
                              <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                                <div>
                                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Time</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatDate(selectedLogDetail.log.clientTimestamp)}
                                  </p>
                                </div>
                                {!!selectedLogDetail.parsedDetail.length && (
                                  <div>
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Length</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {String(selectedLogDetail.parsedDetail.length)} chars
                                    </p>
                                  </div>
                                )}
                                {!!selectedLogDetail.parsedDetail.from && (
                                  <div>
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">From</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {String(selectedLogDetail.parsedDetail.from)}
                                    </p>
                                  </div>
                                )}
                                {!!selectedLogDetail.parsedDetail.to && (
                                  <div>
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">To</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {String(selectedLogDetail.parsedDetail.to)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Message */}
                              <div className="mb-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Message</p>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 [word-break:break-word]">
                                    {selectedLogDetail.log.message}
                                  </p>
                                </div>
                              </div>

                              {/* Content */}
                              {!!selectedLogDetail.parsedDetail.content && (
                                <div>
                                  <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Content</p>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                      {String(selectedLogDetail.parsedDetail.content).length} chars
                                    </span>
                                  </div>
                                  <div className="overflow-hidden rounded-xl border border-blue-100 bg-slate-950 shadow-inner dark:border-blue-900/50">
                                    <pre className="max-h-52 overflow-auto p-4 font-mono text-xs leading-relaxed text-emerald-400 whitespace-pre-wrap [word-break:break-word] [scrollbar-width:thin]">
{String(selectedLogDetail.parsedDetail.content)}</pre>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-900/50">
                              <button
                                onClick={() => setSelectedLogDetail(null)}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                              >
                                <X className="h-4 w-4" />
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabItem>
              {/* // Tamtc */}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
