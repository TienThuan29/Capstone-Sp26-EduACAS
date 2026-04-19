"use client";
import { Skeleton } from "./skeleton";

export function SimilarityTabSkeleton() {
  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <Skeleton className="h-4 w-40 ml-auto" />
      </div>

      {/* Problem Sections */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            {/* Problem Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <div>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-9 w-44 rounded" />
                <Skeleton className="h-9 w-40 rounded" />
              </div>
            </div>

            {/* Groups */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-lg border border-l-4 border-l-[#C9A24D] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-10 w-64 rounded" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, k) => (
                      <Skeleton key={k} className="h-4 w-20" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimilarityDiffModalSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Editor Split */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-1.5">
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="p-4 space-y-2 bg-gray-900 min-h-[400px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-4 bg-gray-700" style={{ width: `${60 + (i % 4) * 10}%` }} />
            ))}
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-1.5">
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="p-4 space-y-2 bg-gray-900 min-h-[400px]">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-4 bg-gray-700" style={{ width: `${50 + (i % 5) * 10}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Match Explorer */}
      <div className="w-64 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="p-2 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
