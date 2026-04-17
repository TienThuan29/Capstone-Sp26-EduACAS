"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "flowbite-react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  TrophyIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useStudentDashboard } from "@/hooks/dashboard/useStudentDashboard";
import { ExamDetailPanel } from "@/app/my-classroom/components/exam-detail-panel";
import type {
  StudentDashboardOverview,
  StudentExamScore,
  StudentWarning,
  StudentScoreTrend,
  StudentSubmissionStats,
} from "@/types/dashboard/StudentDashboardStats";

interface StudentDashboardTabProps {
  classroomId: string;
  classroomName?: string;
  studentId?: string;
}

function TrendIcon({
  trend,
  className,
}: {
  trend: "improving" | "stable" | "declining";
  className?: string;
}) {
  if (trend === "improving") {
    return <ArrowTrendingUpIcon className={`h-5 w-5 ${className}`} />;
  }
  if (trend === "declining") {
    return <ArrowTrendingDownIcon className={`h-5 w-5 ${className}`} />;
  }
  return <MinusIcon className={`h-5 w-5 ${className}`} />;
}

function getScoreColor(score: number): string {
  if (score >= 9) return "text-green-600 dark:text-green-400";
  if (score >= 7) return "text-blue-600 dark:text-blue-400";
  if (score >= 5) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 3) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBgColor(score: number): string {
  if (score >= 9) return "bg-green-100 dark:bg-green-900/30";
  if (score >= 7) return "bg-blue-100 dark:bg-blue-900/30";
  if (score >= 5) return "bg-yellow-100 dark:bg-yellow-900/30";
  if (score >= 3) return "bg-orange-100 dark:bg-orange-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

export function StudentDashboardTab({
  classroomId,
  classroomName,
  studentId,
}: StudentDashboardTabProps) {
  const {
    loading,
    error,
    getOverview,
    getExamScores,
    getWarnings,
    getScoreTrend,
    getSubmissionStats,
  } = useStudentDashboard(classroomId, studentId);

  const [overview, setOverview] = useState<StudentDashboardOverview | null>(null);
  const [examScores, setExamScores] = useState<StudentExamScore[]>([]);
  const [warnings, setWarnings] = useState<StudentWarning[]>([]);
  const [scoreTrend, setScoreTrend] = useState<StudentScoreTrend[]>([]);
  const [submissionStats, setSubmissionStats] = useState<StudentSubmissionStats | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isFetchingRef.current || !classroomId || !studentId) return;
      isFetchingRef.current = true;

      try {
        const [overviewData, scoresData, warningsData, trendData, statsData] =
          await Promise.all([
            getOverview(),
            getExamScores(),
            getWarnings(5),
            getScoreTrend(),
            getSubmissionStats(),
          ]);

        setOverview(overviewData);
        setExamScores(scoresData);
        setWarnings(warningsData);
        setScoreTrend(trendData);
        setSubmissionStats(statsData);
      } finally {
        isFetchingRef.current = false;
      }
    };

    if (classroomId && studentId) {
      void fetchData();
    }
  }, [classroomId, studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="xl" color="info" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  const maxScore = Math.max(10, ...scoreTrend.map((s) => s.score));

  // ── Exam detail view ────────────────────────────────────────────────────────
  if (selectedExamId) {
    return (
      <div className="h-full">
        <ExamDetailPanel
          examId={selectedExamId}
          studentId={studentId}
          onClose={() => setSelectedExamId(null)}
        />
      </div>
    );
  }

  // ── Dashboard view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {classroomName || overview?.className
            ? `Performance overview for ${overview?.className || classroomName}`
            : "Loading..."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* My Average Score */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              My Average Score
            </p>
            <DocumentChartBarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${getScoreColor(
                overview?.averageScore ?? 0
              )}`}
            >
              {overview?.averageScore.toFixed(1) ?? "0.0"}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/10</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <TrendIcon
              trend={(overview?.trend as "improving" | "stable" | "declining") ?? "stable"}
              className={
                overview?.trend === "improving"
                  ? "text-green-500"
                  : overview?.trend === "declining"
                    ? "text-red-500"
                    : "text-gray-400"
              }
            />
            <span className="capitalize text-gray-500 dark:text-gray-400">
              {overview?.trend ?? "stable"}
            </span>
          </div>
        </div>

        {/* Class Average */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Class Average
            </p>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              vs {overview?.classAverage.toFixed(1) ?? "0.0"}
            </span>
          </div>
          <div className="mt-2">
            <span
              className={`text-3xl font-bold ${
                (overview?.averageScore ?? 0) >= (overview?.classAverage ?? 0)
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {(overview?.averageScore ?? 0) >= (overview?.classAverage ?? 0)
                ? "+"
                : ""}
              {(
                (overview?.averageScore ?? 0) - (overview?.classAverage ?? 0)
              ).toFixed(1)}
            </span>
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
              {overview &&
              (overview.averageScore) >= overview.classAverage
                ? "above"
                : "below"}
            </span>
          </div>
        </div>

        {/* My Rank */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              My Rank
            </p>
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              #{overview?.myRank ?? "-"}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              / {overview?.totalStudents ?? 0}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Top {overview?.percentile.toFixed(0) ?? "0"}%
          </p>
        </div>

        {/* Submission Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Submission Rate
            </p>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {overview?.submissionRate.toFixed(0) ?? "0"}%
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {overview?.submittedExams ?? 0} / {overview?.totalExams ?? 0} exams
          </p>
        </div>
      </div>

      {/* Score Trend Chart */}
      {scoreTrend.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Score Trend
          </h3>
          <div className="mt-4">
            <div className="relative h-48">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-gray-400">
                <span>10</span>
                <span>7.5</span>
                <span>5</span>
                <span>2.5</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="absolute left-8 right-0 top-0 h-48">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between border-b border-gray-100 dark:border-gray-700">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full border-b border-dashed border-gray-100 dark:border-gray-800" />
                  ))}
                </div>

                {/* Bars */}
                <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                  {scoreTrend.map((item, idx) => {
                    const height = (item.score / maxScore) * 100;
                    return (
                      <div key={item.examId} className="flex flex-1 flex-col items-center gap-1">
                        <div className="group relative w-full">
                          <div
                            className={`w-full rounded-t-md transition-all ${getScoreBgColor(
                              item.score
                            )}`}
                            style={{ height: `${height}%` }}
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-200 dark:text-gray-800">
                            {item.score.toFixed(1)}
                          </div>
                        </div>
                        <span className="max-w-full truncate text-center text-xs text-gray-500 dark:text-gray-400">
                          {item.examName.length > 8
                            ? item.examName.slice(0, 8) + "..."
                            : item.examName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two columns: My Exams + Warnings + Submission Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Exams */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Exams
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {examScores.filter((e) => e.status === "GRADED").length} completed
            </span>
          </div>
          <div className="space-y-3">
            {examScores.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No exams found
              </p>
            ) : (
              examScores.slice(0, 5).map((exam) => (
                <button
                  key={exam.examId}
                  onClick={() => setSelectedExamId(exam.examId)}
                  className="cursor-pointer flex w-full items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3 text-left transition-colors hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-700/30 dark:hover:bg-blue-900/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {exam.examName}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-600">
                        {exam.mode}
                      </span>
                      {exam.submittedAt && (
                        <span>{formatTimeAgo(exam.submittedAt)}</span>
                      )}
                      {exam.rank > 0 && (
                        <span>Rank #{exam.rank}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    {exam.status === "GRADED" ? (
                      <>
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${getScoreColor(
                              exam.score
                            )}`}
                          >
                            {exam.score.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400">
                            /{exam.totalMark}
                          </span>
                        </div>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </>
                    ) : exam.status === "NOT_SUBMITTED" ? (
                      <>
                        <span className="text-sm text-gray-400">-</span>
                        <XCircleIcon className="h-5 w-5 text-gray-400" />
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-yellow-500">
                          {exam.status}
                        </span>
                        <ClockIcon className="h-5 w-5 text-yellow-500" />
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        {/* Warnings + Submission Stats */}
        <div className="space-y-6">
          {/* My Warnings */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Warnings
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <BellIcon className="h-3.5 w-3.5" />
                {warnings.filter((w) => !w.isRead).length} Unread
              </span>
            </div>
            <div className="space-y-3">
              {warnings.length === 0 ? (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  No warnings in this class
                </p>
              ) : (
                warnings.slice(0, 3).map((warning) => (
                  <div
                    key={warning.warningId}
                    className={`rounded-md border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                      warning.isRead
                        ? "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/30"
                        : "border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {warning.className}
                          </p>
                          {!warning.isRead && (
                            <span className="h-2 w-2 rounded-md bg-blue-500" />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                          {warning.reason}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {formatTimeAgo(warning.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                          warning.warningLevel === 2
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        }`}
                      >
                        Level {warning.warningLevel}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submission Stats */}
          {submissionStats && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Submission Statistics
              </h3>
              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Completed
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {submissionStats.submittedExams} / {submissionStats.totalExams}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(100, submissionStats.submissionRate)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Submission Rate
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {submissionStats.submissionRate.toFixed(0)}%
                    </p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Late Submissions
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        submissionStats.isLate
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {submissionStats.isLate ? "Yes" : "None"}
                    </p>
                  </div>
                </div>

                {submissionStats.latestSubmissionTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      Latest: {formatTimeAgo(submissionStats.latestSubmissionTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}