"use client";
import { Skeleton } from "./skeleton";

export function ExamSessionTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Table Header */}
          <div className="flex gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-4 py-4 dark:border-gray-700">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-8 rounded" />
                <Skeleton className="h-7 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
