"use client";
import { Skeleton } from "./skeleton";

export function SubmissionDetailModalSkeleton() {
  return (
    <div className="space-y-4">
      {/* Submission Summary Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="text-center">
            <Skeleton className="h-6 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto mt-1" />
          </div>
          <Skeleton className="h-8 w-px" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>

      {/* Section Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-t" />
        ))}
      </div>

      {/* Section Content - Info Tab Skeleton */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Submission Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Student Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
