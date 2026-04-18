"use client";
import { Skeleton } from "./skeleton";

export function ExamDetailPanelSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-20 rounded" />
        <Skeleton className="h-5 w-px" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-64" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <Skeleton className="h-10 w-24 rounded-t" />
        <Skeleton className="h-10 w-24 rounded-t" />
      </div>

      {/* Tab Content - Overview Skeleton */}
      <div className="space-y-4">
        {/* Meta Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </div>

        {/* Score Summary */}
        <div className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
          <Skeleton className="h-3 w-32 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="mt-2 flex justify-end">
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
