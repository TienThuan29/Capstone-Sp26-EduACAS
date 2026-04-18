"use client";

import { Skeleton } from "./skeleton";

export function MaterialsTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-1 h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Table skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
        >
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {Array.from({ length: 5 }).map((_, j) => (
                  <th key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {Array.from({ length: 2 }).map((_, k) => (
                <tr key={k} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-12 rounded-md" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
