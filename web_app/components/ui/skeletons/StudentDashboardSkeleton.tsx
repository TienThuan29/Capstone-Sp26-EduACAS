"use client";

import { Skeleton } from "./skeleton";

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Score Trend Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="relative h-48">
          <div className="absolute left-0 top-0 flex h-full flex-col justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-6" />
            ))}
          </div>
          <div className="absolute left-8 right-0 top-0 h-48">
            <div className="flex h-full items-end justify-around gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Exams */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30"
              >
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings + Submission Stats */}
        <div className="space-y-6">
          {/* Warnings */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-md border border-gray-100 p-3 dark:border-gray-700 dark:bg-gray-700/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Stats */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-14 rounded-md" />
                <Skeleton className="h-14 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
