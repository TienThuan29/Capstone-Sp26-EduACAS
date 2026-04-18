"use client";

import { Skeleton } from "./skeleton";

export function QuizDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-600">
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 px-4 dark:border-gray-600">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {/* Overview */}
        <div className="space-y-6">
          {/* Quiz info header */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Quiz action */}
          <Skeleton className="h-12 w-48 mx-auto" />
        </div>

        {/* History table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="px-4 py-3 text-center">
                      <Skeleton className="h-4 w-full mx-auto" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 last:border-0 dark:border-gray-700"
                  >
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        <Skeleton className="h-4 w-full mx-auto" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
