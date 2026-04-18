"use client";

import { Skeleton } from "./skeleton";

export function PractiseTabSkeleton() {
  return (
    <div className="space-y-4 py-20 text-center">
      <Skeleton className="mx-auto h-9 w-64" />
      <Skeleton className="mx-auto h-4 w-96" />
    </div>
  );
}
