"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "flowbite-react";
import {
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/utils/datetime-utils";
import { useToast } from "@/hooks/useToast";
import { useNotification } from "@/hooks/notification/useNotification";
import type { Notification, NotificationType } from "@/types/notification";

export default function NotificationsManagement() {
  const { isDark } = useThemeContext();
  const toast = useToast();
  const { getAllNotificationsAdmin, softDelete } = useNotification();
  
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllNotificationsAdmin(pageIndex, pageSize);
      if (data) {
        setNotifications(data.items);
        setTotalCount(data.totalCount);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.message || "Cannot load notification list");
    } finally {
      setLoading(false);
    }
  }, [getAllNotificationsAdmin, pageIndex, pageSize, toast]);

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
  }, [fetchNotifications]);

  if (!mounted) return null;

  const filteredNotifications = notifications.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.targetUserId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      try {
        const ok = await softDelete(id);
        if (ok) {
          toast.showSuccess("Delete notification successfully");
          fetchNotifications();
        }
      } catch (error: any) {
        toast.showError(error.response?.data?.message || "Cannot delete notification!");
      }
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
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Manage Notifications
          </h1>
          <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Monitor system notifications
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="flex-1 max-w-md">
              <TextInput
                type="text"
                icon={MagnifyingGlassIcon}
                placeholder="Search by title, body, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button color="gray" onClick={fetchNotifications}>
              <ArrowPathIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className={`overflow-x-auto ${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow`}>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="xl" />
              <span className={`ml-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Loading data...</span>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Type</TableHeadCell>
                  <TableHeadCell>Target User</TableHeadCell>
                  <TableHeadCell>Title & Body</TableHeadCell>
                  <TableHeadCell>Sent Date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => (
                    <TableRow key={n.id} className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                      <TableCell>
                        <Badge color={getTypeColor(n.type)}>{n.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs break-all max-w-[150px]">
                        {n.targetUserId}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{n.title}</div>
                        <div className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>{n.body}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(n.sentDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge color={n.isRead ? "success" : "warning"} size="xs" className="w-fit">
                            {n.isRead ? "Read" : "Unread"}
                          </Badge>
                          {n.isDeleted && (
                            <Badge color="failure" size="xs" className="w-fit">
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="xs" color="failure" onClick={() => handleDelete(n.id)}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <InformationCircleIcon className="h-12 w-12 text-gray-400" />
                        <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          No notifications found in the system
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
