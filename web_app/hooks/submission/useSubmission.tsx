'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type { SubmissionResponse } from '@/types/submission';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

/** Hook for submission APIs used by STUDENT, LECTURER, ADMIN (e.g. get by id). */
export const useSubmission = () => {
  const axiosInstance = useAxios();

  const getSubmissionById = useCallback(
    async (id: string): Promise<SubmissionResponse | null> => {
      const response = await axiosInstance.get<ApiResponse<SubmissionResponse>>(
        Api.Submission.GET_BY_ID(id)
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  return {
    getSubmissionById,
  };
};
