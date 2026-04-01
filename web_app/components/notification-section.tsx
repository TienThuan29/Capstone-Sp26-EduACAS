"use client";

import { useState, useCallback } from "react";
import { Dropdown } from "flowbite-react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useSignalRNotification } from "@/hooks/notification/useSignalRNotification";
import { useToast } from "@/hooks/useToast";
import type { RealtimeNotification } from "@/types/notification";

/**
 * Notification bell button and dropdown panel. Connects to SignalR when logged in,
 * shows toasts for new notifications, and displays them in the dropdown when opened.
 */
export function NotificationSection() {
  const { authTokens, isLoggedIn } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const onNotification = useCallback(
    (notification: RealtimeNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
      const message = notification.body
        ? `${notification.title}: ${notification.body}`
        : notification.title;
      toast.showInfo(message);
    },
    [toast]
  );

  const markAsReviewed = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useSignalRNotification({
    accessToken: authTokens?.accessToken ?? null,
    enabled: !!authTokens?.accessToken,
    onNotification,
  });

  if (!isLoggedIn()) return null;

  return (
    <Dropdown
      inline
      placement="bottom-end"
      arrowIcon={false}
      theme={{
        floating: {
          base: "z-[100] w-80 divide-y divide-gray-100 rounded-sm shadow-lg focus:outline-none border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700",
        },
      }}
      label={
        <span className="relative inline-flex">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full cursor-pointer "
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </span>
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"
              aria-hidden
            />
          )}
        </span>
      }
    >
      <div className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-600">
        Notifications
      </div>
      <div
        className="max-h-96 overflow-y-auto"
        role="presentation"
        onClick={markAsReviewed}
      >
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No notifications yet
          </div>
        ) : (
          <ul className="py-1">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 last:border-0 dark:border-gray-600"
              >
                <p className="font-medium text-gray-900 dark:text-white">
                  {n.title}
                </p>
                {n.body ? (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {n.body}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {n.sentDate
                    ? new Date(n.sentDate).toLocaleString()
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dropdown>
  );
}
