"use client";

import { Skeleton } from "./skeleton";

export function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 bg-white dark:bg-gray-800 lg:block">
        <div className="flex h-16 items-center justify-center border-b dark:border-gray-700">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-1 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8 space-y-1">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Stats Grid */}
        <section className="mb-8">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
