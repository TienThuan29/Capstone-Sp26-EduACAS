"use client";

import { useEffect, useState } from "react";
import { Dropdown, Button } from "flowbite-react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/hooks/notification/useNotification";
import type { Notification } from "@/types/notification";

const PAGE_SIZE = 5;

export function NotificationSection() {
  const { isLoggedIn } = useAuth();

  const [pageIndex, setPageIndex] = useState(1);
  const [accumulated, setAccumulated] = useState<Notification[]>([]);

  const { notifications, paged } = useNotification({
    pageIndex,
    pageSize: PAGE_SIZE,
    enabled: !!isLoggedIn(),
    isRead: false,
  });

  // When pageIndex changes, accumulate the new notifications with previous ones
  useEffect(() => {
    if (pageIndex === 1) {
      setAccumulated(notifications);
    } else {
      setAccumulated((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newUnique = notifications.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newUnique];
      });
    }
  }, [pageIndex, notifications]);

  const unreadNotifications = accumulated.filter((n: Notification) => !n.isRead);
  const hasMore = paged.hasNextPage && unreadNotifications.length < paged.totalCount;

  const handleShowMore = () => {
    if (paged.hasNextPage) {
      setPageIndex((prev) => prev + 1);
    }
  };

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
          {unreadNotifications.length > 0 && (
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
      <div className="max-h-96 overflow-y-auto" role="presentation">
        {unreadNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No unread notifications
          </div>
        ) : (
          <>
            <ul className="py-1">
              {unreadNotifications.map((n: Notification) => (
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
            {hasMore && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-600">
                <Button
                  size="sm"
                  className="w-full cursor-pointer"
                  onClick={handleShowMore}
                >
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Dropdown>
  );
}
