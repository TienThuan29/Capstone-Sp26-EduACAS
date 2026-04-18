'use client';

import React from 'react';
import { X, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import clsx from 'clsx';
import type { ViolationOverlayAlertType } from '@/hooks/examination/useExamViolationGuard';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'warning' | 'error' | 'info';
  /** Exam overlay: picks lucide icon (no emoji in titles) */
  alertType?: ViolationOverlayAlertType;
}

export function WarningModal({
  isOpen,
  onClose,
  title,
  message,
  variant = 'warning',
  alertType,
}: WarningModalProps) {
  if (!isOpen) return null;

  const resolvedVariant: 'warning' | 'error' | 'info' =
    alertType === 'lock'
      ? 'error'
      : alertType === 'violation'
        ? 'warning'
        : variant;

  const Icon =
    alertType === 'violation'
      ? AlertTriangle
      : alertType === 'lock'
        ? ShieldAlert
        : resolvedVariant === 'error'
          ? ShieldAlert
          : resolvedVariant === 'info'
            ? Info
            : AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div
            className={clsx(
              'rounded-full p-3',
              resolvedVariant === 'error' && 'bg-red-500/20',
              resolvedVariant === 'warning' && 'bg-yellow-500/20',
              resolvedVariant === 'info' && 'bg-blue-500/20'
            )}
          >
            <Icon
              className={clsx(
                'h-8 w-8',
                resolvedVariant === 'error' && 'text-red-500',
                resolvedVariant === 'warning' && 'text-yellow-500',
                resolvedVariant === 'info' && 'text-blue-500'
              )}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-lg font-semibold text-white">
          {title}
        </h3>

        {/* Message */}
        <p className="mb-6 text-center text-sm text-gray-400">{message}</p>

        {/* Action */}
        <button
          onClick={onClose}
          className={clsx(
            'w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors',
            resolvedVariant === 'error' && 'bg-red-600 hover:bg-red-700',
            resolvedVariant === 'warning' && 'bg-yellow-600 hover:bg-yellow-700',
            resolvedVariant === 'info' && 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
