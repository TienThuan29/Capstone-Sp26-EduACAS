"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import React, { useEffect, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  Tabs,
  TabItem,
  Modal,
  ModalHeader,
  ModalBody,
} from "flowbite-react";
import {
  ExclamationTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAcademicWarning } from "@/hooks/academic-warning/useAcademicWarning";
import { formatDate } from "@/utils/datetime-utils";
import type { AcademicWarningResponse } from "@/types/academic-warning";

interface AcademicWarningsTabProps {
  classroomId: string;
  studentId?: string;
  classroomName?: string;
}

function getWarningLevelColor(level: number): { bg: string; text: string; border: string; label: string } {
  if (level >= 2) {
    return {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-200 dark:border-red-800",
      label: "Critical",
    };
  }
  return {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
    label: "Warning",
  };
}

function getTriggerTypeLabel(type: string): string {
  switch (type) {
    case "SINGLE_EXAM_LOW_SCORE":
      return "Single Exam Low Score";
    case "AVERAGE_EXAM_LOW_SCORE":
      return "Average Exam Low Score";
    default:
      return type;
  }
}

function WarningCard({
  warning,
  onClick,
}: {
  warning: AcademicWarningResponse;
  onClick: () => void;
}) {
  const levelStyle = getWarningLevelColor(warning.warningLevel);

  return (  
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border p-4 transition-all hover:shadow-xs cursor-pointer ${levelStyle.bg} ${levelStyle.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 shrink-0 ${levelStyle.text}`}>
            <ExclamationTriangleIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${levelStyle.bg} ${levelStyle.text} border ${levelStyle.border}`}
              >
                {levelStyle.label} Level {warning.warningLevel}
              </span>
              {!warning.isRead && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  <BellIcon className="h-3 w-3" />
                  New
                </span>
              )}
            </div>
            <p className="mt-1.5 font-semibold text-gray-900 dark:text-white">
              {getTriggerTypeLabel(warning.triggerType)}
            </p>
            {warning.involvedExams && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <BookOpenIcon className="h-4 w-4" />
                <span>
                  {warning.involvedExams.examScores.length} exam
                  {warning.involvedExams.examScores.length !== 1 ? "s" : ""} involved
                  {warning.involvedExams.averageScore > 0 &&
                    ` \u00b7 Avg: ${warning.involvedExams.averageScore.toFixed(1)}`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-3.5 w-3.5" />
            {formatDate(warning.sentDate)}
          </div>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </button>
  );
}

function WarningDetailModal({
  warning,
  onClose,
}: {
  warning: AcademicWarningResponse;
  onClose: () => void;
}) {
  const levelStyle = getWarningLevelColor(warning.warningLevel);

  const analysisEntries = [
    ...Object.entries(warning.llmAnalysis || {}),
    ...Object.entries(warning.lecturerAnalysis || {}),
  ];

  return (
    <Modal show={!!warning} size="xl" popup onClose={onClose}>
      <ModalHeader />
      <ModalBody>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold ${levelStyle.bg} ${levelStyle.text} border ${levelStyle.border}`}
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                {levelStyle.label} Level {warning.warningLevel}
              </span>
              {warning.isRead ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Read
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  <BellIcon className="h-3.5 w-3.5" />
                  Unread
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {getTriggerTypeLabel(warning.triggerType)}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sent on {formatDate(warning.sentDate)}
            </p>
          </div>

          {warning.involvedExams && (
            <Card className="border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Involved Exams
              </h4>
              <div className="space-y-2">
                {Object.entries(warning.involvedExams.examScores).map(([examId, score]) => (
                  <div
                    key={examId}
                    className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-700/30 px-3 py-2"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate mr-4">
                      {examId}
                    </span>
                    <Badge
                      color={
                        score >= 7
                          ? "success"
                          : score >= 5
                            ? "warning"
                            : "failure"
                      }
                    >
                      {score.toFixed(1)} / 10
                    </Badge>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-md bg-blue-50 dark:bg-blue-900/20 px-3 py-2 border border-blue-100 dark:border-blue-800">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Average Score
                  </span>
                  <Badge color="info" className="font-bold">
                    {warning.involvedExams.averageScore.toFixed(1)} / 10
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {analysisEntries.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Analysis & Recommendations
              </h4>
              {analysisEntries.map(([examId, entry], idx) => (
                <Card
                  key={`${examId}-${idx}`}
                  className="border border-gray-200 dark:border-gray-700"
                >
                  <div className="space-y-3">
                    {entry.analysis && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                          Analysis
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {entry.analysis}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {entry.recommendation && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
                          Recommendation
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {entry.recommendation}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

export function AcademicWarningsTab({
  classroomId,
  studentId,
  classroomName,
}: AcademicWarningsTabProps) {
  const { loading, getByClassroomId } = useAcademicWarning();

  const [warnings, setWarnings] = useState<AcademicWarningResponse[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedWarning, setSelectedWarning] = useState<AcademicWarningResponse | null>(null);

  const fetchWarnings = useCallback(async () => {
    try {
      const data = await getByClassroomId(classroomId);
      const studentWarnings = data.filter((w) => w.studentId === studentId);
      setWarnings(studentWarnings);
    } catch (err) {
      console.error("Failed to fetch academic warnings:", err);
    }
  }, [classroomId, studentId, getByClassroomId]);

  useEffect(() => {
    void fetchWarnings();
  }, [fetchWarnings]);

  const unreadWarnings = warnings.filter((w) => !w.isRead);
  const readWarnings = warnings.filter((w) => w.isRead);

  if (loading && warnings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white border-l-8 border-[#1F4E79] pl-4">
          Academic Warnings
        </h2>
        {classroomName && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {classroomName}
          </p>
        )}
      </div>

      {warnings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-md border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CheckCircleIcon className="h-14 w-14 text-green-400 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            No Academic Warnings
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You have no academic warnings in this classroom. Keep up the good work!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="p-4 [&_button[role=tab]]:cursor-pointer">
            <Tabs
              aria-label="Academic warnings tabs"
              onActiveTabChange={(tab) => setActiveTab(tab)}
            >
              <TabItem
                title={
                  <span className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4" />
                    All Warnings ({warnings.length})
                  </span>
                }
                active={activeTab === 0}
              >
                <div className="space-y-3 pt-2">
                  {warnings.map((warning) => (
                    <WarningCard
                      key={warning.id}
                      warning={warning}
                      onClick={() => setSelectedWarning(warning)}
                    />
                  ))}
                </div>
              </TabItem>

              <TabItem
                title={
                  <span className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4" />
                    Unread ({unreadWarnings.length})
                  </span>
                }
                active={activeTab === 1}
              >
                <div className="space-y-3 pt-2">
                  {unreadWarnings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <CheckCircleIcon className="h-10 w-10 text-green-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        All warnings have been read
                      </p>
                    </div>
                  ) : (
                    unreadWarnings.map((warning) => (
                      <WarningCard
                        key={warning.id}
                        warning={warning}
                        onClick={() => setSelectedWarning(warning)}
                      />
                    ))
                  )}
                </div>
              </TabItem>

              <TabItem
                title={
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    Read ({readWarnings.length})
                  </span>
                }
                active={activeTab === 2}
              >
                <div className="space-y-3 pt-2">
                  {readWarnings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <BellIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No read warnings
                      </p>
                    </div>
                  ) : (
                    readWarnings.map((warning) => (
                      <WarningCard
                        key={warning.id}
                        warning={warning}
                        onClick={() => setSelectedWarning(warning)}
                      />
                    ))
                  )}
                </div>
              </TabItem>
            </Tabs>
          </div>
        </div>
      )}

      {selectedWarning && (
        <WarningDetailModal
          warning={selectedWarning}
          onClose={() => setSelectedWarning(null)}
        />
      )}
    </div>
  );
}
