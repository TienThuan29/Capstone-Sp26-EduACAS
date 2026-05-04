'use client';

import { useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import type {
  SubmissionResponse,
  ProblemSubmissionsResponse,
  BulkSubmissionGradingRequest,
  AutoGradeProblemResponse,
  AutoGradeSubmissionResult,
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

  const reGradeSubmission = useCallback(
    async (submissionId: string, languageId: string, compilerId: string): Promise<AutoGradeSubmissionResult> => {
      const response = await axiosInstance.post<ApiResponse<AutoGradeSubmissionResult>>(
        Api.Submission.RE_GRADE(submissionId),
        { compilerId, languageId }
      );
      const data = response.data?.dataResponse;
      if (!data) {
        throw new Error(response.data?.error ?? 'Re-grading failed');
      }
      return data;
    },
    [axiosInstance]
  );

  const overrideSubmissionScore = useCallback(
    async (submissionId: string, finalScore: number, maxMark: number): Promise<void> => {
      const response = await axiosInstance.patch<ApiResponse<boolean>>(
        Api.Submission.OVERRIDE_SCORE(submissionId),
        { finalScore, maxMark }
      );
      if (!response.data?.dataResponse) {
        throw new Error(response.data?.error ?? 'Score override failed');
      }
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
    getLatestSubmissionsByExamAndProblem,
    getLatestSubmissionsByExam,
    runAutoGrading,
    reGradeSubmission,
    overrideSubmissionScore,
    getVersionsByStudentExamProblem,
  };
};
