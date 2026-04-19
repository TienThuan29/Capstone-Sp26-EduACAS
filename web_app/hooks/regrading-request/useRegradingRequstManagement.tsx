import { useState, useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type {
  RegradingRequest,
  RegradingRequestStatus,
  HandleRegradingRequestPayload,
} from "@/types/regrading-request";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

interface UseRegradingRequestManagementOptions {
  pageIndex?: number;
  pageSize?: number;
}

export const useRegradingRequestManagement = ({
  pageIndex: initialPageIndex = 1,
  pageSize: initialPageSize = 10,
}: UseRegradingRequestManagementOptions = {}) => {
  const axiosInstance = useAxios();

  const [requests, setRequests] = useState<RegradingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPaged = useCallback(
    async (params?: {
      pageIndex?: number;
      pageSize?: number;
      studentId?: string;
      examId?: string;
      status?: RegradingRequestStatus;
    }): Promise<{
      items: RegradingRequest[];
      totalCount: number;
      totalPages: number;
    } | null> => {
      const pageIdx = params?.pageIndex ?? initialPageIndex;
      const pageSz = params?.pageSize ?? initialPageSize;
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<
          ApiResponse<{
            items: RegradingRequest[];
            totalCount: number;
            pageIndex: number;
            pageSize: number;
            totalPages: number;
            hasPreviousPage: boolean;
            hasNextPage: boolean;
          }>
        >(
          Api.RegradingRequest.GET_ALL_PAGED(
            pageIdx,
            pageSz,
            params?.studentId,
            params?.examId,
            params?.status
          )
        );
        const data = response.data?.dataResponse;
        if (!data) return null;
        setRequests(data.items);
        return {
          items: data.items,
          totalCount: data.totalCount,
          totalPages: data.totalPages,
        };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load regrading requests";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, initialPageIndex, initialPageSize]
  );

  const getById = useCallback(
    async (id: string): Promise<RegradingRequest | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<
          ApiResponse<RegradingRequest>
        >(Api.RegradingRequest.GET_BY_ID(id));
        return response.data?.dataResponse ?? null;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) return null;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load regrading request";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const getByStudentId = useCallback(
    async (studentId: string): Promise<RegradingRequest[]> => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<
          ApiResponse<RegradingRequest[]>
        >(Api.RegradingRequest.GET_BY_STUDENT(studentId));
        return response.data?.dataResponse ?? [];
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load regrading requests for student";
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const getByExamId = useCallback(
    async (examId: string): Promise<RegradingRequest[]> => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<
          ApiResponse<RegradingRequest[]>
        >(Api.RegradingRequest.GET_BY_EXAM(examId));
        return response.data?.dataResponse ?? [];
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load regrading requests for exam";
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const getBySubmissionId = useCallback(
    async (submissionId: string): Promise<RegradingRequest[]> => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<
          ApiResponse<RegradingRequest[]>
        >(Api.RegradingRequest.GET_BY_SUBMISSION(submissionId));
        return response.data?.dataResponse ?? [];
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load regrading requests for submission";
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const approve = useCallback(
    async (
      id: string,
      payload: HandleRegradingRequestPayload
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await axiosInstance.post<ApiResponse<RegradingRequest>>(
          Api.RegradingRequest.APPROVE(id),
          payload
        );
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to approve regrading request";
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const reject = useCallback(
    async (
      id: string,
      payload: HandleRegradingRequestPayload
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await axiosInstance.post<ApiResponse<RegradingRequest>>(
          Api.RegradingRequest.REJECT(id),
          payload
        );
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to reject regrading request";
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await axiosInstance.delete<ApiResponse<void>>(
          Api.RegradingRequest.GET_BY_ID(id)
        );
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to delete regrading request";
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  return {
    requests,
    loading,
    error,
    getPaged,
    getById,
    getByStudentId,
    getByExamId,
    getBySubmissionId,
    approve,
    reject,
    remove,
  };
};
