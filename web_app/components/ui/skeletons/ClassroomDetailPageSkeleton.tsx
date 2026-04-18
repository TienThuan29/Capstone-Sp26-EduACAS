"use client";

import { Skeleton } from "./skeleton";

export function ClassroomDetailPageSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 bg-white dark:bg-gray-800 lg:block">
        <div className="flex h-16 items-center justify-center border-b dark:border-gray-700">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-1 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-grow overflow-hidden p-4 transition-all duration-300 lg:p-8">
        {/* Header with back button */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>

        {/* Tab content placeholder */}
        <div className="space-y-6">
          {/* Overview skeleton (default tab) */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <Skeleton className="h-6 w-40 rounded-full" />
                </div>
                <Skeleton className="mb-5 h-10 w-3/4" />
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <div className="mt-8 flex items-center gap-5 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div>
                    <Skeleton className="mb-1 h-2 w-24" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                </div>
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
                <div className="mt-2 flex items-center gap-4 border border-gray-100 bg-gray-50/80 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div>
                    <Skeleton className="mb-1 h-2 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="rounded-lg border border-gray-100 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
                <Skeleton className="mb-8 h-6 w-48" />
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5" />
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-4 w-24" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
                <Skeleton className="mt-12 h-16 w-full" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
