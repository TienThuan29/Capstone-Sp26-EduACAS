"use client";

import { Skeleton } from "./skeleton";

export function QuizzesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow last:rounded-b-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-3">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </th>
                <th className="px-4 py-3">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </th>
                <th className="px-4 py-3">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </th>
                <th className="px-4 py-3">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </th>
                <th className="px-4 py-3">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 last:border-0 dark:border-gray-700"
                >
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Skeleton className="h-5 w-16 mx-auto" />
                    <Skeleton className="h-3 w-12 mx-auto mt-1" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Skeleton className="h-4 w-28 mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Skeleton className="h-4 w-28 mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Skeleton className="h-4 w-6 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
