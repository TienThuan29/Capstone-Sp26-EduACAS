'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type { 
  ErrorGroupSummary, 
  ErrorGroupDetail, 
  ErrorGroupRequest 
} from '@/types/error-group';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useErrorGroup = () => {
  const axiosInstance = useAxios();

  const generateErrorGroups = useCallback(
    async (request: ErrorGroupRequest): Promise<number> => {
      const response = await axiosInstance.post<ApiResponse<number>>(Api.ErrorGroup.GENERATE, request);
      return response.data?.dataResponse ?? 0;
    },
    [axiosInstance]
  );

  const checkSimilarity = useCallback(
    async (request: ErrorGroupRequest): Promise<string> => {
      const response = await axiosInstance.post<ApiResponse<string>>(Api.ErrorGroup.CHECK_SIMILARITY, request);
      return response.data?.message ?? 'Success';
    },
    [axiosInstance]
  );

  const getErrorGroupsByProblem = useCallback(
    async (examId: string, problemId: string): Promise<ErrorGroupSummary[]> => {
      const response = await axiosInstance.get<ApiResponse<ErrorGroupSummary[]>>(
        Api.ErrorGroup.GET_SUMMARY_BY_PROBLEM(examId, problemId)
      );
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

  const getErrorGroupsByExam = useCallback(
    async (examId: string): Promise<ErrorGroupSummary[]> => {
      const response = await axiosInstance.get<ApiResponse<ErrorGroupSummary[]>>(
        Api.ErrorGroup.GET_SUMMARY_BY_EXAM(examId)
      );
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

  const getErrorGroupDetail = useCallback(
    async (groupId: string): Promise<ErrorGroupDetail> => {
      const response = await axiosInstance.get<ApiResponse<ErrorGroupDetail>>(
        Api.ErrorGroup.GET_DETAIL(groupId)
      );
      const data = response.data?.dataResponse;
      if (!data) {
        throw new Error(response.data?.error ?? 'Failed to get error group detail');
      }
      return data;
    },
    [axiosInstance]
  );

  return {
    generateErrorGroups,
    checkSimilarity,
    getErrorGroupsByProblem,
    getErrorGroupsByExam,
    getErrorGroupDetail,
  };
};
