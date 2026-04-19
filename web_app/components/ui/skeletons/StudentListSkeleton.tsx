"use client";

import { Skeleton } from "./skeleton";

export function StudentListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-7 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-6" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-32" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 last:border-0 dark:border-gray-700"
              >
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-6" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-12" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-14 rounded" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="h-7 w-7 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex overflow-x-auto border-t border-gray-200 py-4 sm:justify-center dark:border-gray-700">
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
