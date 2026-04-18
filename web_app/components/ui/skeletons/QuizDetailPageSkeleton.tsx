"use client";
import { Skeleton } from "./skeleton";

export function QuizDetailPageSkeleton() {
  return (
    <div className="p-8">
      {/* Header section */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Main table skeleton */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-32 mx-auto" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-28 mx-auto" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16 mx-auto" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-24 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3">
                  <Skeleton className="h-8 w-20 rounded mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-xl" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-24 w-64 rounded" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-10 w-20 rounded mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-10 w-20 rounded mx-auto" />
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
