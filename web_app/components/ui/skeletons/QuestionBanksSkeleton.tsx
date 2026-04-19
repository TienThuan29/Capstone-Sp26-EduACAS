"use client";
import { Skeleton } from "./skeleton";

export function QuestionBanksSkeleton() {
  return (
    <div className="p-8">
      {/* Header section */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Filter and action bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <Skeleton className="min-w-55 max-w-md h-10 flex-1 rounded-lg" />
          <Skeleton className="min-w-45 h-10 w-32 rounded-lg" />
          <Skeleton className="min-w-40 h-10 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-full mx-auto" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16 mx-auto" />
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {Array.from({ length: 8 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-xl" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-center">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton */}
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
