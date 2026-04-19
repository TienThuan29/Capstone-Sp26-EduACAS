"use client";

import { Skeleton } from "./skeleton";

export function ManageClassroomPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Navbar skeleton */}
      <div className="h-16 bg-gray-100 dark:bg-gray-800">
        <Skeleton className="mx-auto mt-3 h-8 w-48 rounded-md" />
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-7xl grow px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>

        {/* Filter bar */}
        <div className="sticky top-20 z-10 mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-sm border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {/* Table header */}
          <div className="hidden grid-cols-5 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold tracking-wider text-gray-600 uppercase md:grid dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 hover:bg-gray-50 md:grid-cols-5 md:items-center md:gap-4 dark:border-gray-700 dark:hover:bg-gray-800/50"
            >
              <div className="grid grid-cols-2 gap-2 md:items-center">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-end pt-2 md:pt-0">
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mb-12 mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <FooterSkeleton />
    </div>
  );
}

function FooterSkeleton() {
  return (
    <footer className="bg-gray-100 py-6 dark:bg-gray-800">
      <div className="container mx-auto px-4 text-center">
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
    </footer>
  );
}
