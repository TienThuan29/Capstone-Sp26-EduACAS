"use client";
import { Skeleton } from "./skeleton";

export function DefaultPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header with Greeting */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Notifications */}
          <div className="lg:col-span-1">
            <Skeleton className="h-8 w-44 mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Recently accessed */}
            <div className="mb-8">
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-40 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-12 rounded-lg" />
            </div>

            {/* Classroom List */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <div className="flex h-32">
                    <Skeleton className={`w-32 h-full ${i % 2 === 0 ? "bg-indigo-600" : "bg-teal-600"}`} />
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsSectionSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClassroomListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="flex h-32">
            <Skeleton className={`w-32 h-full ${i % 2 === 0 ? "bg-indigo-600" : "bg-teal-600"}`} />
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
