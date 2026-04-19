"use client";

import { Skeleton } from "./skeleton";

export function ExamsTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Loading spinner or table */}
      <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        {/* Table header */}
        <div className="bg-gray-50 dark:bg-gray-700/50">
          <div className="grid grid-cols-10 gap-4 px-4 py-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
          >
            <div className="grid grid-cols-10 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
