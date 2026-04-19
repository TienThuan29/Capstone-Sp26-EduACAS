"use client";

import { Skeleton } from "./skeleton";

export function OverviewTabSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left side - main content */}
      <div className="space-y-8 lg:col-span-2">
        {/* Classroom info card */}
        <div className="relative overflow-hidden border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-8 md:p-10">
            {/* Badges */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="mb-5 h-10 w-3/4" />

            {/* Meta info */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>

            {/* Lecturer card */}
            <div className="mt-8 flex items-center gap-5 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div>
                <Skeleton className="mb-1 h-2 w-24" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>

            {/* Enrol key card */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="mb-1 h-2 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </div>

            {/* Slot number card */}
            <div className="mt-2 flex items-center gap-4 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div>
                <Skeleton className="mb-1 h-2 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - actions */}
      <div className="space-y-8">
        {/* Status card */}
        <div className="border border-gray-100 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mb-8 h-6 w-48" />
          {/* Timeline skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-3 w-3 rounded-full shrink-0 mt-1.5" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <Skeleton className="mt-12 h-16 w-full" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
