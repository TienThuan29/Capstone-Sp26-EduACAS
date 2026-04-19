"use client";
import { Skeleton } from "./skeleton";

export function ExamDetailTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32 rounded" />
      </div>

      {/* Detail Rows */}
      <div className="space-y-1 pt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1 border-b border-gray-100 py-2 dark:border-gray-600">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SubmissionsTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <Skeleton className="h-10 w-40 rounded" />
        <Skeleton className="h-10 w-32 rounded" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="flex gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SubmissionDetailTabSkeleton() {
  return (
    <div className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-600">
        <Skeleton className="h-10 w-40 rounded" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="p-4 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <Skeleton className="h-10 w-24 rounded-t" />
          <Skeleton className="h-10 w-32 rounded-t" />
          <Skeleton className="h-10 w-36 rounded-t" />
          <Skeleton className="h-10 w-32 rounded-t" />
        </div>

        {/* Source Code */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" style={{ width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
