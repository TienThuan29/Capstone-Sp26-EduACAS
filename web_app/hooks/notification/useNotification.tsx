/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification, PagedNotifications, RealtimeNotification } from "@/types/notification";
import { useSignalRNotification } from "@/hooks/notification/useSignalRNotification";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

type UseNotificationOptions = {
  pageIndex?: number;
  pageSize?: number;
  enabled?: boolean;
};

function sortUnreadFirstNewest(items: Notification[]): Notification[] {
  return items
    .slice()
    .sort((a, b) => {
      const aRead = a.isRead ? 1 : 0;
      const bRead = b.isRead ? 1 : 0;
      if (aRead !== bRead) return aRead - bRead; // unread (false) first
      return new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime();
    });
}

function toNotificationFromRealtime(payload: RealtimeNotification): Notification {
  return {
    ...payload,
    isRead: false,
    isDeleted: false,
  };
}

export const useNotification = ({
  pageIndex = 1,
  pageSize = 10,
  enabled = true,
}: UseNotificationOptions = {}) => {
  const axiosInstance = useAxios();
  const { user, authTokens } = useAuth();

  const userId = user?.id ?? null;
  const accessToken = authTokens?.accessToken ?? null;

  const [paged, setPaged] = useState<PagedNotifications>({
    items: [],
    totalCount: 0,
    pageIndex,
    pageSize,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageIndexRef = useRef(pageIndex);
  const pageSizeRef = useRef(pageSize);
  pageIndexRef.current = pageIndex;
  pageSizeRef.current = pageSize;

  const refresh = useCallback(async () => {
    if (!enabled || !userId) return;
    setLoading(true);
    setError(null);

    try {
      const url = `${Api.Notification.GET_BY_USER}?userId=${encodeURIComponent(
        userId
      )}&pageIndex=${encodeURIComponent(pageIndex)}&pageSize=${encodeURIComponent(pageSize)}`;

      const response = await axiosInstance.get<ApiResponse<PagedNotifications>>(url);
      const data = response.data?.dataResponse;

      if (!data) {
        setPaged({
          items: [],
          totalCount: 0,
          pageIndex,
          pageSize,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        });
        return;
      }

      setPaged(data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        // Treat 404 as "no notifications" (e.g. user has no records / backend not returning an empty list).
        setPaged({
          items: [],
          totalCount: 0,
          pageIndex,
          pageSize,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        });
        setError(null);
        return;
      }

      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to load notifications";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, enabled, userId, pageIndex, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { connectionState } = useSignalRNotification({
    accessToken,
    enabled: enabled && !!accessToken && !!userId,
    onNotification: (payload) => {
      if (!userId) return;
      if (payload.targetUserId !== userId) return;

      const incoming = toNotificationFromRealtime(payload);
      setPaged((prev) => {
        const exists = prev.items.some((x) => x.id === incoming.id);
        const merged = exists
          ? prev.items.map((x) => (x.id === incoming.id ? incoming : x))
          : [incoming, ...prev.items];

        const sorted = sortUnreadFirstNewest(merged);
        const nextItems = pageIndexRef.current === 1 ? sorted.slice(0, pageSizeRef.current) : sorted;

        // optimistic totalCount only when viewing first page; otherwise we refetch.
        const nextTotalCount =
          pageIndexRef.current === 1 ? prev.totalCount + (exists ? 0 : 1) : prev.totalCount;

        const nextTotalPages = Math.ceil(nextTotalCount / pageSizeRef.current) || 0;
        const nextHasPrevious = pageIndexRef.current > 1;
        const nextHasNext = pageIndexRef.current < nextTotalPages;

        return {
          ...prev,
          items: nextItems,
          totalCount: nextTotalCount,
          totalPages: nextTotalPages,
          hasPreviousPage: nextHasPrevious,
          hasNextPage: nextHasNext,
          pageIndex: pageIndexRef.current,
          pageSize: pageSizeRef.current,
        };
      });

      // For pages other than the first, the new unread item may shift results.
      // To keep pagination accurate, refresh.
      if (pageIndexRef.current !== 1) {
        refresh();
      }
    },
  });

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const response = await axiosInstance.patch<ApiResponse<boolean>>(
        Api.Notification.MARK_READ(notificationId)
      );
      const ok = response.data?.dataResponse ?? false;
      if (ok) await refresh();
      return ok;
    },
    [axiosInstance, refresh]
  );

  const softDelete = useCallback(
    async (notificationId: string) => {
      const response = await axiosInstance.patch<ApiResponse<boolean>>(
        Api.Notification.SOFT_DELETE(notificationId)
      );
      const ok = response.data?.dataResponse ?? false;
      if (ok) await refresh();
      return ok;
    },
    [axiosInstance, refresh]
  );

  return useMemo(
    () => ({
      notifications: paged.items,
      paged,
      loading,
      error,
      connectionState,
      refresh,
      markAsRead,
      softDelete,
    }),
    [paged, loading, error, connectionState, refresh, markAsRead, softDelete]
  );
};

