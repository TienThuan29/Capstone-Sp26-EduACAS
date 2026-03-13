'use client';

import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { Button } from 'flowbite-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Affects icon and confirm button color. Default 'red' for destructive/leave actions. */
  confirmVariant?: 'red' | 'green' | 'yellow';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'red',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    red: {
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-500',
      buttonColor: 'red' as const,
      Icon: AlertTriangle,
    },
    green: {
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
      buttonColor: 'green' as const,
      Icon: CheckCircle,
    },
    yellow: {
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-500',
      buttonColor: 'yellow' as const,
      Icon: AlertTriangle,
    },
  };
  const style = variantStyles[confirmVariant];
  const IconComponent = style.Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-xl">
        {/* Close button */}
        <Button
          size='xs'
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div
            className={clsx(
              'rounded-full p-3',
              style.iconBg,
            )}
          >
            <IconComponent
              className={clsx(
                'h-8 w-8',
                style.iconColor,
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

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            color="gray"
            className="flex-1 cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            color={style.buttonColor}
            className="flex-1 cursor-pointer"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
