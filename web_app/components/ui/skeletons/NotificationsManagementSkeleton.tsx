"use client";

import { Skeleton } from "./skeleton";

export function NotificationsManagementSkeleton() {
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
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* Table skeleton */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="px-4 py-3 text-center">
                      <Skeleton className="h-4 w-full mx-auto" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {Array.from({ length: 10 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1 mx-auto w-fit">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="h-8 w-8 rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination skeleton */}
          <div className="flex justify-center mt-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
