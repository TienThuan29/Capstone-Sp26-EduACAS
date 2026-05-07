'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type { CacheExamLogsRequest, CreateExamLogRequest, ExamLogResponse, FlushCachedExamLogsRequest } from '@/types/submission';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
}

export const useExamLog = () => {
  const axiosInstance = useAxios();

  const createExamLog = useCallback(
    async (payload: CreateExamLogRequest): Promise<void> => {
      await axiosInstance.post<ApiResponse<unknown>>(Api.ExamLog.CREATE, payload);
    },
    [axiosInstance]
  );

  const createExamLogs = useCallback(
    async (payloads: CreateExamLogRequest[]): Promise<void> => {
      if (payloads.length === 0) return;
      await Promise.allSettled(payloads.map((payload) => createExamLog(payload)));
    },
    [createExamLog]
  );

  const cacheExamLogs = useCallback(
    async (payload: CacheExamLogsRequest): Promise<void> => {
      if (!payload.sessionKey || payload.entries.length === 0) return;
      await axiosInstance.post<ApiResponse<unknown>>(Api.ExamLog.CACHE, payload);
    },
    [axiosInstance]
  );

  const flushCachedExamLogs = useCallback(
    async (payload: FlushCachedExamLogsRequest): Promise<void> => {
      if (!payload.sessionKey || !payload.submissionId) return;
      await axiosInstance.post<ApiResponse<unknown>>(Api.ExamLog.FLUSH_CACHE, payload);
    },
    [axiosInstance]
  );

  const getExamLogsBySubmission = useCallback(
    async (submissionId: string): Promise<ExamLogResponse[]> => {
      if (!submissionId) return [];
      console.log("[useExamLog] GET request:", Api.ExamLog.GET_BY_SUBMISSION(submissionId));
      const response = await axiosInstance.get<ApiResponse<ExamLogResponse[]>>(
        Api.ExamLog.GET_BY_SUBMISSION(submissionId),
      );
      console.log("[useExamLog] Raw response:", response);
      console.log("[useExamLog] response.data:", response.data);
      const logs = response.data?.dataResponse ?? [];
      console.log("[useExamLog] Parsed logs:", logs);
      return logs;
    },
    [axiosInstance]
  );

  return {
    createExamLog,
    createExamLogs,
    cacheExamLogs,
    flushCachedExamLogs,
    getExamLogsBySubmission,
  };
};
