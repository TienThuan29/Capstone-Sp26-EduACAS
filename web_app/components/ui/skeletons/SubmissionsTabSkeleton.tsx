"use client";
import { Skeleton } from "./skeleton";

export function SubmissionsTabSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Submission Versions */}
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, vIdx) => (
              <div
                key={vIdx}
                className={`flex items-center justify-between rounded-md border p-2 text-xs ${
                  vIdx === 0
                    ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10"
                    : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-3 w-24" />
                  {vIdx === 0 && <Skeleton className="h-4 w-12 rounded" />}
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
