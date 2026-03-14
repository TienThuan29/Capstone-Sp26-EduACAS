'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type {
  SubmissionResponse,
  ProblemSubmissionsResponse,
  BulkSubmissionGradingRequest,
  AutoGradeProblemResponse,
} from '@/types/submission';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useSubmissionLecturer = () => {
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

  /** Fetches latest submissions for all problems of an exam in one request (avoids N parallel requests). */
  const getLatestSubmissionsByExam = useCallback(
    async (examId: string): Promise<ProblemSubmissionsResponse[]> => {
      const response = await axiosInstance.get<
        ApiResponse<ProblemSubmissionsResponse[]>
      >(Api.Submission.GET_LATEST_BY_EXAM(examId));
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

  const runAutoGrading = useCallback(
    async (
      request: BulkSubmissionGradingRequest
    ): Promise<AutoGradeProblemResponse> => {
      const response = await axiosInstance.post<
        ApiResponse<AutoGradeProblemResponse>
      >(Api.Submission.AUTO_GRADE, request);
      const data = response.data?.dataResponse;
      if (!data) {
        throw new Error(response.data?.error ?? 'Auto-grading failed');
      }
      return data;
    },
    [axiosInstance]
  );

  return {
    getLatestSubmissionsByExamAndProblem,
    getLatestSubmissionsByExam,
    runAutoGrading,
  };
};
