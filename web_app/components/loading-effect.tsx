'use client';

import { useEffect } from 'react';
import { Spinner } from 'flowbite-react';

export interface FullPageLoaderProps {
  /** Controls visibility of the overlay */
  isLoading: boolean;
  /** Optional text displayed below the spinner (default: "Loading...") */
  message?: string;
  /** Spinner size: "xs" | "sm" | "md" | "lg" | "xl" (default: "xl") */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Full-page overlay loader for API loading states.
 * Locks body scroll when active and centers spinner + optional message.
 */
export function FullPageLoader({
  isLoading,
  message = 'Loading...',
  size = 'xl',
}: FullPageLoaderProps) {
  // Lock body scroll when loader is active
  useEffect(() => {
    if (isLoading) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size={size} color="info" aria-hidden="true" />
        {message && (
          <p className="text-sm font-medium text-gray-200">{message}</p>
        )}
      </div>
    </div>
  );
}
