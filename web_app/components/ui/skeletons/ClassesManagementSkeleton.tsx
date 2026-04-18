"use client";

import { Skeleton } from "./skeleton";

export function ClassesManagementSkeleton() {
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
        <div className="mb-8 flex justify-between items-end">
          <div className="space-y-1">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>

        {/* Card */}
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* Table skeleton */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <Skeleton className="h-4 w-full mx-auto" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {Array.from({ length: 8 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="h-6 w-20 rounded-full" />
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
