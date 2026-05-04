'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type {
  ProblemSubmissionsResponse,
  SubmitProblemRequest,
  SubmissionResponse,
  AutoGradeSubmissionResult,
} from '@/types/submission';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useSubmissionStudent = () => {
  const axiosInstance = useAxios();

  const saveSubmission = useCallback(
    async (payload: SubmitProblemRequest): Promise<SubmissionResponse | null> => {
      const response = await axiosInstance.post<ApiResponse<SubmissionResponse>>(
        Api.Submission.SAVE,
        payload
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  const forceSubmission = useCallback(
    async (payload: SubmitProblemRequest): Promise<SubmissionResponse | null> => {
      const response = await axiosInstance.post<ApiResponse<SubmissionResponse>>(
        Api.Submission.FORCE,
        payload
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  const getSubmissionsByStudentId = useCallback(
    async (studentId: string): Promise<SubmissionResponse[]> => {
      const response = await axiosInstance.get<ApiResponse<SubmissionResponse[]>>(
        Api.Submission.GET_BY_STUDENT(studentId)
      );
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

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
  
  const getLatestSubmissionsByExam = useCallback(
    async (examId: string): Promise<ProblemSubmissionsResponse[]> => {
      const response = await axiosInstance.get<ApiResponse<ProblemSubmissionsResponse[]>>(
        Api.Submission.GET_LATEST_BY_EXAM(examId)
      );
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

  const submitAndGrade = useCallback(
    async (payload: SubmitProblemRequest): Promise<AutoGradeSubmissionResult | null> => {
      const response = await axiosInstance.post<ApiResponse<AutoGradeSubmissionResult>>(
        Api.Submission.SUBMIT_AND_GRADE,
        payload
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  const getVersionsByStudentExamProblem = useCallback(
    async (examId: string, problemId: string, studentId: string): Promise<SubmissionResponse[]> => {
      const response = await axiosInstance.get<ApiResponse<SubmissionResponse[]>>(
        Api.Submission.GET_VERSIONS_BY_STUDENT_EXAM_PROBLEM(examId, problemId, studentId)
      );
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance]
  );

  return {
    saveSubmission,
    forceSubmission,
    submitAndGrade,
    getSubmissionsByStudentId,
    getLatestSubmissionsByExamAndProblem,
    getLatestSubmissionsByExam,
    getVersionsByStudentExamProblem,
  };
};
