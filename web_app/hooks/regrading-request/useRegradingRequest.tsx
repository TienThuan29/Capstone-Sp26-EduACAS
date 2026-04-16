import { useState, useCallback, useEffect } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { useAuth } from "@/contexts/AuthContext";
import type {
  RegradingRequest,
  CreateRegradingRequestPayload,
} from "@/types/regrading-request";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

interface UseRegradingRequestOptions {
  pageIndex?: number;
  pageSize?: number;
  enabled?: boolean;
}

export const useRegradingRequest = ({
  pageIndex = 1,
  pageSize = 10,
  enabled = true,
}: UseRegradingRequestOptions = {}) => {
  const axiosInstance = useAxios();
  const { user } = useAuth();

  const userId = user?.id ?? "";

  const [myRequests, setMyRequests] = useState<RegradingRequest[]>([]);
  const [pagedRequests, setPagedRequests] = useState<{
    items: RegradingRequest[];
    totalCount: number;
    totalPages: number;
  }>({
    items: [],
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMyRequests = useCallback(async (): Promise<RegradingRequest[]> => {
    if (!userId) return [];
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<
        ApiResponse<RegradingRequest[]>
      >(Api.RegradingRequest.GET_BY_STUDENT(userId));
      return response.data?.dataResponse ?? [];
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to load your regrading requests";
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, userId]);

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

  const getPaged = useCallback(
    async (
      pageIdx: number = pageIndex,
      pageSz: number = pageSize,
      studentId?: string
    ): Promise<{
      items: RegradingRequest[];
      totalCount: number;
      totalPages: number;
    } | null> => {
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
            studentId,
            undefined,
            undefined
          )
        );
        const data = response.data?.dataResponse;
        if (!data) return null;
        setPagedRequests({
          items: data.items,
          totalCount: data.totalCount,
          totalPages: data.totalPages,
        });
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
    [axiosInstance, pageIndex, pageSize]
  );

  const create = useCallback(
    async (payload: CreateRegradingRequestPayload): Promise<RegradingRequest | null> => {
      if (!userId) {
        setError("User not authenticated");
        return null;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.post<
          ApiResponse<RegradingRequest>
        >(Api.RegradingRequest.CREATE, payload, {
          headers: { "X-User-Id": userId },
        });
        return response.data?.dataResponse ?? null;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to create regrading request";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, userId]
  );

  const cancel = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await axiosInstance.post<ApiResponse<RegradingRequest>>(
          Api.RegradingRequest.CANCEL(id)
        );
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to cancel regrading request";
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  /** Convenience helper for ExamDetailPanel: create from exam context. */
  const submitFromExamDetail = useCallback(
    async (examinationId: string, submissionId: string, reason: string, imageUrls: string[] = []): Promise<boolean> => {
      const payload: CreateRegradingRequestPayload = {
        examinationId,
        submissionId,
        imageUrls,
        reason,
      };
      const result = await create(payload);
      return result !== null;
    },
    [create]
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    const requests = await getMyRequests();
    setMyRequests(requests);
  }, [getMyRequests, userId]);

  useEffect(() => {
    if (enabled && userId) {
      getMyRequests().then(setMyRequests);
    }
  }, [enabled, userId, getMyRequests]);

  return {
    myRequests,
    pagedRequests,
    loading,
    error,
    getMyRequests,
    getById,
    getPaged,
    create,
    cancel,
    submitFromExamDetail,
    refresh,
  };
};
