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

export const useSubmissionStudent = () => {
  const axiosInstance = useAxios();

  const getLatestSubmissionsByExamAndProblem = useCallback(
    async (
      examId: string,
      problemId: string
    ): Promise<SubmissionResponse[]> => {
      const response = await axiosInstance.get<ApiResponse<SubmissionResponse[]>>(
        Api.Submission.GET_LATEST_BY_EXAM_AND_PROBLEM(examId, problemId)
      );
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

  return {
    getLatestSubmissionsByExamAndProblem,
  };
};
