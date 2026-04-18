"use client";

import { Skeleton } from "./skeleton";

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
  showActions?: boolean;
}

export function AdminTableSkeleton({
  columns = 5,
  rows = 8,
  showActions = true
}: AdminTableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-full mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
