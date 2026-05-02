"use client";

import { useState } from "react";
import { Spinner, Tabs, TabItem } from "flowbite-react";
import {
  BellIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/hooks/notification/useNotification";
import { useToast } from "@/hooks/useToast";
import { CustomPagination } from "@/components/custom-pagination";
import Sidebar from "@/components/sidebar";
import type { Notification } from "@/types/notification";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(0);
  const [unreadPage, setUnreadPage] = useState(1);
  const [readPage, setReadPage] = useState(1);

  const {
    notifications: unreadNotifications,
    paged: unreadPaged,
    loading: unreadLoading,
    markAsRead: callMarkAsRead,
    softDelete: callSoftDelete,
    refresh: refreshUnread,
  } = useNotification({
    pageIndex: unreadPage,
    pageSize: PAGE_SIZE,
    enabled: !!user?.id,
    isRead: false,
  });

  const {
    notifications: readNotifications,
    paged: readPaged,
    loading: readLoading,
    markAsRead: callMarkAsReadRead,
    softDelete: callSoftDeleteRead,
    refresh: refreshRead,
  } = useNotification({
    pageIndex: readPage,
    pageSize: PAGE_SIZE,
    enabled: !!user?.id,
    isRead: true,
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await callMarkAsRead(notificationId);
      toast.showSuccess("Marked as read");
    } catch {
      toast.showError("Failed to mark as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await callSoftDelete(notificationId);
      toast.showSuccess("Notification deleted");
    } catch {
      toast.showError("Failed to delete notification");
    }
  };

  const handlePageChange = (tabIndex: number) => (page: number) => {
    if (tabIndex === 0) {
      setUnreadPage(page);
    } else {
      setReadPage(page);
    }
  };

  const renderNotificationItem = (n: Notification, showActions = false) => (
    <div
      key={n.id}
      className={`p-4 rounded-lg border transition-colors ${
        isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700/50" : "bg-white border-gray-100 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-blue-900/40" : "bg-blue-50"}`}>
          <BellIcon className={`h-4 w-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
              {n.type.replace(/_/g, " ")}
            </span>
            {!n.isRead && (
              <span className="flex h-2 w-2 rounded-full bg-blue-500" title="Unread" />
            )}
          </div>
          <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
            {n.title}
          </p>
          {n.body && (
            <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {n.body}
            </p>
          )}
          <p className={`mt-2 text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            {n.sentDate ? new Date(n.sentDate).toLocaleString() : ""}
          </p>
        </div>
        {showActions && (
          <div className="flex flex-col gap-1 shrink-0">
            {!n.isRead && (
              <button
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-1.5 rounded transition-colors ${isDark ? "hover:bg-green-900/30 text-green-400" : "hover:bg-green-50 text-green-600"}`}
                title="Mark as read"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(n.id)}
              className={`p-1.5 rounded transition-colors ${isDark ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-50 text-red-600"}`}
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="ml-20 grow p-4 lg:ml-64 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Notifications
            </h1>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              View and manage your notifications
            </p>
          </div>

          <Tabs onActiveTabChange={setActiveTab}>
            <TabItem active={activeTab === 0} title={
              <span className="flex items-center gap-2">
                <EnvelopeOpenIcon className="h-4 w-4" />
                Unread
                {unreadPaged.totalCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
                    {unreadPaged.totalCount > 99 ? "99+" : unreadPaged.totalCount}
                  </span>
                )}
              </span>
            }>
              <div className="mt-4 space-y-3">
                {unreadLoading && unreadNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Spinner size="xl" />
                    <p className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Loading...</p>
                  </div>
                ) : unreadNotifications.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-16 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <EnvelopeOpenIcon className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No unread notifications</p>
                  </div>
                ) : (
                  <>
                    {unreadNotifications.map((n) => renderNotificationItem(n, true))}
                    <CustomPagination
                      currentPage={unreadPage}
                      totalPages={unreadPaged.totalPages}
                      onPageChange={handlePageChange(0)}
                    />
                  </>
                )}
              </div>
            </TabItem>

            <TabItem active={activeTab === 1} title={
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Read
              </span>
            }>
              <div className="mt-4 space-y-3">
                {readLoading && readNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Spinner size="xl" />
                    <p className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Loading...</p>
                  </div>
                ) : readNotifications.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-16 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <CheckCircleIcon className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No read notifications</p>
                  </div>
                ) : (
                  <>
                    {readNotifications.map((n) => renderNotificationItem(n, true))}
                    <CustomPagination
                      currentPage={readPage}
                      totalPages={readPaged.totalPages}
                      onPageChange={handlePageChange(1)}
                    />
                  </>
                )}
              </div>
            </TabItem>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
