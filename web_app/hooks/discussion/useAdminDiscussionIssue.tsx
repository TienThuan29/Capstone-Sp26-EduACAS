"use client";

import { useCallback, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { PagedDiscussionIssues } from "@/types/discussion";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export function useAdminDiscussionIssue() {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminDiscussions = useCallback(
    async (search?: string, pageIndex = 1, pageSize = 10) => {
      try {
        setLoading(true);
        setError(null);
        let url = `${Api.DiscussionIssue.GET_ADMIN}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        
        const response = await axiosInstance.get<ApiResponse<PagedDiscussionIssues>>(url);
        return response.data?.dataResponse;
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to load discussion issues";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const softDeleteIssue = useCallback(
    async (issueId: string) => {
      try {
        setLoading(true);
        const url = Api.DiscussionIssue.SOFT_DELETE(issueId);
        await axiosInstance.patch(url);
        return true;
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to delete issue";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const getDiscussionDetail = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        const url = `${Api.DiscussionIssue.BASE}/${id}`;
        const response = await axiosInstance.get<any>(url);
        return response.data?.dataResponse;
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to load discussion detail";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const toggleDiscussionStatus = useCallback(
    async (issueId: string, currentStatus: string) => {
      try {
        setLoading(true);
        const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
        const url = Api.DiscussionIssue.CHANGE_STATUS(issueId);
        await axiosInstance.patch(url, { issueId, status: newStatus });
        return true;
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to toggle status";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  return {
    getAdminDiscussions,
    getDiscussionDetail,
    toggleDiscussionStatus,
    softDeleteIssue,
    loading,
    error,
  };
}
