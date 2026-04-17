"use client";

import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { AtRiskStudent } from "@/types/dashboard/DashboardStats";

interface AtRiskStudentsListProps {
  students: AtRiskStudent[];
}

function TrendIcon({
  trend,
  className,
}: {
  trend: "improving" | "stable" | "declining";
  className?: string;
}) {
  if (trend === "improving") {
    return <ArrowTrendingUpIcon className={`h-4 w-4 ${className}`} />;
  }
  if (trend === "declining") {
    return <ArrowTrendingDownIcon className={`h-4 w-4 ${className}`} />;
  }
  return <MinusIcon className={`h-4 w-4 ${className}`} />;
}

export function AtRiskStudentsList({ students }: AtRiskStudentsListProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Students at Risk
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <ExclamationTriangleIcon className="h-3.5 w-3.5" />
          {students.filter((s) => s.warningLevel === 2).length} Critical
        </span>
      </div>
      <div className="space-y-3">
        {students.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            No at-risk students in this class
          </p>
        ) : (
          students.map((student) => (
            <div
              key={student.studentId}
              className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700/30 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-red-400 to-red-600 font-semibold text-white">
                  {student.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-white">
                    {student.studentName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Avg: {student.averageScore.toFixed(1)}/10</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <div className="flex items-center gap-1">
                      <TrendIcon
                        trend={student.trend}
                        className={
                          student.trend === "improving"
                            ? "text-green-500"
                            : student.trend === "declining"
                              ? "text-red-500"
                              : "text-gray-400"
                        }
                      />
                      <span className="capitalize">{student.trend}</span>
                    </div>
                  </div>
                </div>
              </div>
              {student.warningLevel && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    student.warningLevel === 2
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  }`}
                >
                  Level {student.warningLevel}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
