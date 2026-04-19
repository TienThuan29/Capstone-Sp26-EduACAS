"use client";

import { Skeleton } from "./skeleton";

export function MaterialsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-32" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr
                key={i}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-xs" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-12 rounded" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-7 w-7" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
