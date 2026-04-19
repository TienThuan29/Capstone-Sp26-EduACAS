"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import type { RecentWarning } from "@/types/dashboard/DashboardStats";

interface RecentWarningsListProps {
  warnings: RecentWarning[];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

export function RecentWarningsList({ warnings }: RecentWarningsListProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Warnings
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
          warnings.map((warning) => (
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
                      {warning.studentName}
                    </p>
                    {!warning.isRead && (
                      <span className="h-2 w-2 rounded-md bg-blue-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                    {warning.message}
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
  );
}