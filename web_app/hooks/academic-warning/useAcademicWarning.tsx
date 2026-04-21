'use client';

import { useCallback, useState } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type {
  SendAcademicWarningBatchRequest,
  SendAcademicWarningResponse,
  AcademicWarningResponse,
} from '@/types/academic-warning';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useAcademicWarning = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);

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

  const getByStudentId = useCallback(
    async (studentId: string): Promise<AcademicWarningResponse[]> => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<ApiResponse<AcademicWarningResponse[]>>(
          Api.AcademicWarning.GET_BY_STUDENT(studentId)
        );
        return response.data?.dataResponse ?? [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const getByClassroomId = useCallback(
    async (classroomId: string): Promise<AcademicWarningResponse[]> => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<ApiResponse<AcademicWarningResponse[]>>(
          Api.AcademicWarning.GET_BY_CLASSROOM(classroomId)
        );
        return response.data?.dataResponse ?? [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  return {
    loading,
    sendBatchAcademicWarnings,
    getByStudentId,
    getByClassroomId,
  };
};
