'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type {
  SendAcademicWarningBatchRequest,
  SendAcademicWarningResponse,
} from '@/types/academic-warning';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useAcademicWarning = () => {
  const axiosInstance = useAxios();

  const sendBatchAcademicWarnings = useCallback(
    async (request: SendAcademicWarningBatchRequest): Promise<SendAcademicWarningResponse> => {
      const response = await axiosInstance.post<ApiResponse<SendAcademicWarningResponse>>(
        Api.AcademicWarning.SEND_BATCH,
        request
      );
      const data = response.data?.dataResponse;
      if (!data) {
        throw new Error(response.data?.error ?? 'Failed to send academic warnings');
      }
      return data;
    },
    [axiosInstance]
  );

  return {
    sendBatchAcademicWarnings,
  };
};
