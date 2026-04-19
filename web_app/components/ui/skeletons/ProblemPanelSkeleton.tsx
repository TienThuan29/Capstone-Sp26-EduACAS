"use client";
import { Skeleton } from "./skeleton";

export function ProblemPanelSkeleton() {
  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <Skeleton className="h-12 w-28" />
        <Skeleton className="h-12 w-44" />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ProblemPanelSkeletonContent />
      </div>
    </div>
  );
}

export function ProblemPanelSkeletonContent() {
  return (
    <div className="prose prose-invert max-w-none">
      {/* Problem Title & Difficulty */}
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>

      {/* Markdown Content Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="my-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <div className="my-4" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Code Block Skeleton */}
      <div className="my-4 rounded-md bg-gray-800 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>

      {/* More Content */}
      <div className="space-y-2 mt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* PDF Attachment */}
      <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50">
        <div className="border-b border-gray-700 px-4 py-2">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="min-h-[200px] p-2">
          <Skeleton className="h-[75vh] w-full rounded" />
        </div>
      </div>
    </div>
  );
}

export function SubmissionsTabSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-700 bg-gray-800 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
