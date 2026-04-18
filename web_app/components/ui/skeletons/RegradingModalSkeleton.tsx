"use client";
import { Skeleton } from "./skeleton";

export function RegradingModalSkeleton() {
  return (
    <div className="space-y-4">
      {/* Submission Info Summary */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="text-center">
            <Skeleton className="h-5 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto mt-1" />
          </div>
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>

        {/* Image Upload Section */}
        <div>
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>

          {/* Drop Zone */}
          <Skeleton className="h-32 w-full rounded-lg border-2 border-dashed" />

          {/* Image Preview Grid */}
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded" />
          <Skeleton className="h-10 flex-1 rounded" />
        </div>
      </div>
    </div>
  );
}
