'use client';
import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { Toast, ToastToggle } from 'flowbite-react';
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  isVisible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast) {
        // Trigger exit animation
        return prev.map((t) => (t.id === id ? { ...t, isVisible: false } : t));
      }
      return prev;
    });
    
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 400);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastMessage = { id, message, type, isVisible: false };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Trigger entrance animation
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isVisible: true } : t))
      );
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckIcon,
          iconBg: 'bg-green-100 dark:bg-green-800',
          iconText: 'text-green-500 dark:text-green-200',
        };
      case 'error':
        return {
          icon: XMarkIcon,
          iconBg: 'bg-red-100 dark:bg-red-800',
          iconText: 'text-red-500 dark:text-red-200',
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          iconBg: 'bg-orange-100 dark:bg-orange-700',
          iconText: 'text-orange-500 dark:text-orange-200',
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          iconText: 'text-blue-500 dark:text-blue-200',
        };
      default:
        return {
          icon: InformationCircleIcon,
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          iconText: 'text-blue-500 dark:text-blue-200',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => {
          const config = getToastConfig(toast.type);
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              className={`min-w-[300px] ${
                toast.isVisible
                  ? 'translate-x-0 opacity-100 scale-100'
                  : 'translate-x-[120%] opacity-0 scale-95'
              }`}
              style={{
                transform: toast.isVisible 
                  ? 'translateX(0) scale(1)' 
                  : 'translateX(120%) scale(0.95)',
                opacity: toast.isVisible ? 1 : 0,
                transitionProperty: 'transform, opacity',
                transitionDuration: '400ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform, opacity',
              }}
            >
              <Toast className="min-w-[300px]">
                <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconText}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3 text-sm font-normal">{toast.message}</div>
                <ToastToggle onDismiss={() => removeToast(toast.id)} />
              </Toast>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

