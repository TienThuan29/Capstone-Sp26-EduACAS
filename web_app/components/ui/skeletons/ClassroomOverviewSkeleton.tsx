"use client";

import { Skeleton } from "./skeleton";

export function ClassroomOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Main info */}
      <div className="space-y-8 lg:col-span-2">
        <div className="relative overflow-hidden border border-gray-100 bg-white p-8 dark:border-gray-700 dark:bg-gray-800 md:p-10">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-gradient-to-bl from-blue-900/10 to-transparent opacity-50 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-gradient-to-tr from-amber-600/10 to-transparent opacity-50 blur-3xl" />

          <div className="relative">
            {/* Badges */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>

            {/* Title */}
            <Skeleton className="h-9 w-3/4 mb-5" />

            {/* Info */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Lecturer card */}
            <div className="mt-8 flex items-center gap-5 border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-900/40">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-5 w-36" />
              </div>
            </div>

            {/* Enrol Key */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-900/40">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>

            {/* Slot Number */}
            <div className="mt-2 flex items-center gap-4 border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-900/40">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-2 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-8">
        {/* Classroom Status */}
        <div className="border border-gray-100 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="h-6 w-36 mb-8" />
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-3 w-3 rounded-full mt-1.5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="mt-12 h-24 w-full rounded-lg" />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
