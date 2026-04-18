"use client";

import { Skeleton } from "./skeleton";

export function LecturerDashboardSkeleton() {
  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Score Distribution Chart */}
      <Skeleton className="h-80 w-full rounded-lg" />

      {/* Two columns: At Risk + Warnings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Exam Statistics Chart */}
      <Skeleton className="h-64 w-full rounded-lg" />

      {/* Student Series Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
            <Skeleton className="h-52 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
