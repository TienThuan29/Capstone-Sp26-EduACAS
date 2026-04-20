"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useThemeContext } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";
import {
  Button,
  TextInput,
  Badge,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Pagination,
  Modal,
  ModalHeader,
  ModalBody,
} from "flowbite-react";
import {
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/utils/datetime-utils";
import { useToast } from "@/hooks/useToast";
import { useNotification } from "@/hooks/notification/useNotification";
import { useUserManagement } from "@/hooks/user/useUserManagement";
import type { Notification, NotificationType } from "@/types/notification";
import { NotificationsManagementSkeleton } from "@/components/ui/skeletons";

export default function NotificationsManagement() {
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { getAllNotificationsAdmin, softDelete } = useNotification();
  const { getAllUsers } = useUserManagement();

  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<Record<string, { fullname: string; email: string }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSearch, setTempSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await getAllUsers();
      const map: Record<string, { fullname: string; email: string }> = {};
      users.forEach(u => {
        map[u.id] = { fullname: u.fullname, email: u.email };
      });
      setUserMap(map);
    } catch (error) {
      console.error("Failed to fetch users for mapping", error);
    }
  }, [getAllUsers]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllNotificationsAdmin(pageIndex, pageSize, searchTerm);
      if (data) {
        setNotifications(data.items);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || "Cannot load notification list");
    } finally {
      setLoading(false);
    }
  }, [getAllNotificationsAdmin, pageIndex, pageSize, searchTerm, toast]);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
    fetchNotifications();
  }, [fetchUsers, fetchNotifications]);

  if (!mounted) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(tempSearch);
    setPageIndex(1);
  };

  const onPageChange = (page: number) => {
    setPageIndex(page);
  };

  const openDeleteModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNotification) return;
    try {
      const ok = await softDelete(selectedNotification.id);
      if (ok) {
        toast.showSuccess("Delete notification successfully");
        setIsDeleteModalOpen(false);
        setSelectedNotification(null);
        fetchNotifications();
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || "Cannot delete notification!");
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "SYSTEM": return "info";
      case "ACADEMIC_WARNING_LEVEL_1": return "warning";
      case "ACADEMIC_WARNING_LEVEL_2": return "failure";
      case "NEW_EXAMINATION": return "purple";
      case "GRADE_RESULT": return "success";
      default: return "gray";
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {loading ? (
          <NotificationsManagementSkeleton />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Manage Notifications
                </h1>
                <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Monitor and manage system-wide notifications
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <form className="grow max-w-md flex gap-3" onSubmit={handleSearch}>
              <div className="flex-1">
                <TextInput
                  type="text"
                  placeholder="Search by title, body, or user ID..."
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  icon={MagnifyingGlassIcon}
                  className="w-full"
                />
              </div>
              <Button type="submit" color="blue">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <Button color="gray" onClick={() => { setPageIndex(1); fetchNotifications(); }} title="Refresh">
                <ArrowPathIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell className="text-center">Type</TableHeadCell>
                  <TableHeadCell>Target User</TableHeadCell>
                  <TableHeadCell>Title & Content</TableHeadCell>
                  <TableHeadCell className="text-center">Sent Date</TableHeadCell>
                  <TableHeadCell className="text-center">Status</TableHeadCell>
                  <TableHeadCell className="text-center">Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y-0">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Spinner size="xl" />
                      <div className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading notifications...</div>
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <InformationCircleIcon className={`w-12 h-12 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No notifications found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((n) => (
                    <TableRow key={n.id} className={isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge color={getTypeColor(n.type)} className="font-bold text-[10px] sm:text-xs">
                            {n.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className={`max-w-45 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {userMap[n.targetUserId] ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-sm truncate" title={userMap[n.targetUserId].fullname}>
                              {userMap[n.targetUserId].fullname}
                            </span>
                            <span className="text-[10px] opacity-70 truncate" title={userMap[n.targetUserId].email}>
                              {userMap[n.targetUserId].email}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-[10px] opacity-50">{n.targetUserId}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{n.title}</div>
                        <div className={`text-sm line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{n.body}</div>
                      </TableCell>
                      <TableCell className={`text-center whitespace-nowrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {formatDate(n.sentDate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge color={n.isRead ? "success" : "warning"} size="xs" className="w-fit font-bold">
                            {n.isRead ? "READ" : "UNREAD"}
                          </Badge>
                          {n.isDeleted && (
                            <Badge color="failure" size="xs" className="w-fit font-bold">
                              DELETED
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => openDeleteModal(n)}
                            title="Delete notification"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex justify-center mt-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <Pagination
                currentPage={pageIndex}
                totalPages={totalPages}
                onPageChange={onPageChange}
                showIcons
              />
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className={`mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {((pageIndex - 1) * pageSize) + 1} to {Math.min(pageIndex * pageSize, totalCount)} of {totalCount} notifications
            </div>
          )}
        </div>
          </>
        )}
      </main>

      <Modal
        show={isDeleteModalOpen}
        size="md"
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedNotification(null);
        }}
        popup
        theme={{
          root: {
            base: "fixed inset-x-0 bottom-0 z-[200] h-modal w-full overflow-y-auto overflow-x-hidden p-4 md:inset-0 md:h-full",
          },
        }}
      >
        <ModalHeader />
        <ModalBody className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-2xl`}>
          <div>
            <h3 className={`mb-4 text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Confirm delete
            </h3>
            <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Are you sure you want to delete the notification{" "}
              <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                &quot;{selectedNotification?.title}&quot;
              </span>
              ?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleConfirmDelete}
                className="cursor-pointer px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center"
              >
                Delete notification
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedNotification(null);
                }}
                className={`cursor-pointer px-6 py-2.5 font-bold rounded-xl transition-colors ${isDark
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-[#374151] text-white hover:bg-gray-600"
                  }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
