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

export const useStudentExamSession = () => {
  const axiosInstance = useAxios();

  const getActive = useCallback(async (): Promise<StudentExamSessionDto | null> => {
    const { data } = await axiosInstance.get<ApiResponse<StudentExamSessionDto | null>>(Api.StudentExamSession.ACTIVE);
    return data?.dataResponse ?? null;
  }, [axiosInstance]);

  const getByExam = useCallback(
    async (examId: string): Promise<StudentExamSessionDto | null> => {
      const { data } = await axiosInstance.get<ApiResponse<StudentExamSessionDto | null>>(
        Api.StudentExamSession.BY_EXAM(examId)
      );
      return data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  const start = useCallback(
    async (examId: string): Promise<StudentExamSessionDto | null> => {
      const { data } = await axiosInstance.post<ApiResponse<StudentExamSessionDto>>(Api.StudentExamSession.START, {
        examId,
      });
      return data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  const complete = useCallback(
    async (examId: string): Promise<StudentExamSessionDto | null> => {
      const { data } = await axiosInstance.post<ApiResponse<StudentExamSessionDto>>(Api.StudentExamSession.COMPLETE, {
        examId,
      });
      return data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  const lock = useCallback(
    async (examId: string, lockReason?: string): Promise<StudentExamSessionDto | null> => {
      const { data } = await axiosInstance.post<ApiResponse<StudentExamSessionDto>>(Api.StudentExamSession.LOCK, {
        examId,
        lockReason,
      });
      return data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  const setActiveProblem = useCallback(
    async (examId: string, problemId: string | null): Promise<StudentExamSessionDto | null> => {
      const { data } = await axiosInstance.post<ApiResponse<StudentExamSessionDto>>(
        Api.StudentExamSession.ACTIVE_PROBLEM,
        { examId, problemId }
      );
      return data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  return { getActive, getByExam, start, complete, lock, setActiveProblem };
};
