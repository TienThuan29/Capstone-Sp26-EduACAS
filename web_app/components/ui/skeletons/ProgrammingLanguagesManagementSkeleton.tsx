"use client";

import { Skeleton } from "./skeleton";

export function ProgrammingLanguagesManagementSkeleton() {
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
        {/* Header & Toolbar */}
        <div className="mb-8">
          <div className="mb-8 space-y-1">
            <Skeleton className="h-10 w-80 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <Skeleton className="h-4 w-full mx-auto" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {Array.from({ length: 10 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16 rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <Skeleton key={j} className="h-5 w-12 rounded" />
                        ))}
                        <Skeleton className="h-5 w-12 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Skeleton className="h-8 w-24 rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
