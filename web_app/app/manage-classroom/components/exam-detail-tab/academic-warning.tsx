"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge, Spinner, Button } from "flowbite-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAcademicWarning } from "@/hooks/academic-warning/useAcademicWarning";
import type { AcademicWarningResponse } from "@/types/academic-warning";
import type { Examination } from "@/types/examination";
import { formatDate } from "@/utils/datetime-utils";

export type AcademicWarningTabContentProps = {
  examination: Examination;
  /** Increment this value (e.g. by using a counter state) to trigger an automatic refresh of warnings. */
  refreshTrigger?: number;
};

export function AcademicWarningTabContent({
  examination,
  refreshTrigger = 0,
}: AcademicWarningTabContentProps) {
  const { getByExamId, loading } = useAcademicWarning();
  const [warnings, setWarnings] = useState<AcademicWarningResponse[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWarnings = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getByExamId(examination.id);
      setWarnings(data);
    } catch {
      console.error("Failed to load academic warnings");
    } finally {
      setRefreshing(false);
    }
  }, [examination.id, getByExamId]);

  useEffect(() => {
    loadWarnings();
  }, [loadWarnings]);

  // Re-load when refreshTrigger changes (triggered by parent after sending warnings)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadWarnings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading warnings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Academic Warnings ({warnings.length})
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Warnings sent for exam: {examination.examName}
          </p>
        </div>
        <Button
          size="sm"
          color="gray"
          className="cursor-pointer"
          onClick={loadWarnings}
          disabled={refreshing}
        >
          {refreshing ? <Spinner size="sm" /> : null}
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {warnings.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 py-10 text-center dark:border-gray-600 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No academic warnings have been sent for this exam yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className="rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div
                className="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => toggleExpand(warning.id)}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {warning.studentName || warning.studentId}
                  </span>
                  <Badge
                    color={
                      warning.warningLevel === 2
                        ? "failure"
                        : warning.warningLevel === 1
                          ? "warning"
                          : "info"
                    }
                  >
                    Level {warning.warningLevel}
                  </Badge>
                  {warning.isRead ? (
                    <Badge color="gray">Read</Badge>
                  ) : (
                    <Badge color="purple">Unread</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Avg:{" "}
                    {warning.involvedExams?.averageScore != null
                      ? `${warning.involvedExams.averageScore.toFixed(1)}`
                      : "—"}
                  </span>
                  <span>{formatDate(warning.sentDate)}</span>
                  <span className="text-xs">▼</span>
                </div>
              </div>

              {expandedId === warning.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <InfoRow label="Warning ID" value={warning.id} />
                    <InfoRow label="Classroom" value={warning.classroomName || warning.classroomId} />
                    <InfoRow label="Exam" value={warning.examName || warning.examId} />
                    <InfoRow label="Problem" value={warning.problemTitle || warning.problemId} />
                    <InfoRow label="Student" value={warning.studentName || warning.studentId} />
                    <InfoRow label="Trigger Type" value={warning.triggerType} />
                    <InfoRow
                      label="Sent Date"
                      value={formatDate(warning.sentDate)}
                    />
                    <InfoRow
                      label="Created Date"
                      value={formatDate(warning.createdDate)}
                    />
                  </div>

                  {warning.involvedExams && (
                    <div className="mt-4">
                      <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Exam Scores
                      </h5>
                      <div className="space-y-1">
                        {Object.entries(warning.involvedExams.examScores).map(
                          ([examId, score]) => (
                            <div
                              key={examId}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {examId === examination.id ? "This Exam" : examId}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {score.toFixed(1)}
                              </span>
                            </div>
                          )
                        )}
                        <div className="flex items-center justify-between border-t pt-1 font-semibold">
                          <span className="text-gray-700 dark:text-gray-300">Average</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {warning.involvedExams.averageScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {Object.keys(warning.llmAnalysis).length > 0 && (
                    <div className="mt-4">
                      <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        LLM Analysis
                      </h5>
                      <div className="space-y-3">
                        {Object.entries(warning.llmAnalysis).map(
                          ([problemId, entry]) => (
                            <div
                              key={problemId}
                              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-700"
                            >
                              <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                Problem: {problemId}
                              </div>
                              {entry.analysis && (
                                <div className="mb-2">
                                  <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Analysis:
                                  </div>
                                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:m-0 prose-headings:mt-2 prose-headings:mb-1">
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                      {entry.analysis}
                                    </Markdown>
                                  </div>
                                </div>
                              )}
                              {entry.recommendation && (
                                <div>
                                  <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Recommendation:
                                  </div>
                                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:m-0 prose-headings:mt-2 prose-headings:mb-1">
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                      {entry.recommendation}
                                    </Markdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {Object.keys(warning.lecturerAnalysis).length > 0 && (
                    <div className="mt-4">
                      <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Lecturer Analysis
                      </h5>
                      <div className="space-y-3">
                        {Object.entries(warning.lecturerAnalysis).map(
                          ([problemId, entry]) => (
                            <div
                              key={problemId}
                              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-700"
                            >
                              <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                Problem: {problemId}
                              </div>
                              {entry.analysis && (
                                <div className="mb-2">
                                  <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Analysis:
                                  </div>
                                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:m-0 prose-headings:mt-2 prose-headings:mb-1">
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                      {entry.analysis}
                                    </Markdown>
                                  </div>
                                </div>
                              )}
                              {entry.recommendation && (
                                <div>
                                  <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Recommendation:
                                  </div>
                                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:m-0 prose-headings:mt-2 prose-headings:mb-1">
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                      {entry.recommendation}
                                    </Markdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
        {label}
      </span>
      <p className="truncate text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
