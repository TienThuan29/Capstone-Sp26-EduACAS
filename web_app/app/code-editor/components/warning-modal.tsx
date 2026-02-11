'use client';

import React from 'react';
import { X, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import clsx from 'clsx';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'warning' | 'error' | 'info';
}

export function WarningModal({
  isOpen,
  onClose,
  title,
  message,
  variant = 'warning',
}: WarningModalProps) {
  if (!isOpen) return null;

  const Icon = variant === 'error' ? ShieldAlert : variant === 'info' ? Info : AlertTriangle;

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
              variant === 'error' && 'bg-red-500/20',
              variant === 'warning' && 'bg-yellow-500/20',
              variant === 'info' && 'bg-blue-500/20'
            )}
          >
            <Icon
              className={clsx(
                'h-8 w-8',
                variant === 'error' && 'text-red-500',
                variant === 'warning' && 'text-yellow-500',
                variant === 'info' && 'text-blue-500'
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
            variant === 'error' && 'bg-red-600 hover:bg-red-700',
            variant === 'warning' && 'bg-yellow-600 hover:bg-yellow-700',
            variant === 'info' && 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
