'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type { StudentExamSessionDto } from '@/types/student-exam-session';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
}

export const useExamSessionManagement = () => {
  const axiosInstance = useAxios();

  const getSessionsByExamId = useCallback(
    async (examId: string): Promise<StudentExamSessionDto[]> => {
      const { data } = await axiosInstance.get<ApiResponse<StudentExamSessionDto[]>>(
        Api.StudentExamSession.GET_BY_EXAM(examId)
      );
      return data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

  const hardDeleteSession = useCallback(
    async (examId: string, studentId: string): Promise<boolean> => {
      const { data } = await axiosInstance.delete<ApiResponse<boolean>>(
        Api.StudentExamSession.HARD_DELETE(examId, studentId)
      );
      return data?.dataResponse ?? false;
    },
    [axiosInstance]
  );

  return {
    getSessionsByExamId,
    hardDeleteSession,
  };
};