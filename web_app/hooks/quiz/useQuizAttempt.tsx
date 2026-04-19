import { useState, useCallback } from 'react';
import useAxios from '../useAxios';
import { Api } from '@/configs/api';
import {
  QuizAttempt,
  QuizAttemptResponse,
  StartQuizAttemptRequest,
  UpdateQuizAnswerRequest
} from '@/types/quiz';

export const useQuizAttempt = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAttempt = useCallback(async (request: StartQuizAttemptRequest): Promise<QuizAttemptResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post<{ dataResponse: QuizAttemptResponse }>(Api.QuizAttempt.START, request);
      return response.data.dataResponse;
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || 'Failed to start quiz attempt';
      console.error('Failed to start quiz attempt:', serverMessage);
      throw new Error(serverMessage);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  const updateAnswer = useCallback(async (attemptId: string, request: UpdateQuizAnswerRequest): Promise<boolean> => {
    try {
      setError(null);
      await axiosInstance.post(Api.QuizAttempt.UPDATE_ANSWER(attemptId), request);
      return true;
    } catch (err) {
      console.error('Failed to update answer:', err);
      return false;
    }
  }, [axiosInstance]);

  const submitAttempt = useCallback(async (attemptId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await axiosInstance.post(Api.QuizAttempt.SUBMIT(attemptId));
      return true;
    } catch (err) {
      console.error('Failed to submit quiz attempt:', err);
      setError('Failed to submit quiz attempt');
      return false;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  const getHistory = useCallback(async (classroomQuizId: string, studentId: string): Promise<QuizAttemptResponse[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<{ dataResponse: QuizAttemptResponse[] }>(
        Api.QuizAttempt.GET_HISTORY_BY_CLASSROOM_QUIZ_STUDENT(classroomQuizId, studentId)
      );
      return response.data.dataResponse ?? [];
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return [];
      }
      console.error('Failed to fetch quiz history:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  const getSubmissionsPaged = useCallback(async (classroomQuizId: string, pageIndex: number, pageSize: number): Promise<{ items: QuizAttemptResponse[], totalCount: number, totalPages: number } | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<{ dataResponse: { items: QuizAttemptResponse[], totalCount: number, totalPages: number } }>(
        Api.QuizAttempt.GET_SUBMISSIONS_PAGED(classroomQuizId, pageIndex, pageSize)
      );
      return response.data.dataResponse;
    } catch (err: any) {
      console.error('Failed to fetch quiz submissions:', err);
      setError('Failed to fetch quiz submissions');
      return null;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // ---------------
  const getAttemptsByStudent = useCallback(async (studentId: string): Promise<QuizAttempt[]> => {
    try {
      setError(null);
      const response = await axiosInstance.get<{ dataResponse: QuizAttempt[] }>(
        Api.QuizAttempt.GET_BY_STUDENT(studentId)
      );
      return response.data.dataResponse ?? [];
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return [];
      }
      console.error('Failed to fetch quiz attempts by student:', err);
      return [];
    }
  }, [axiosInstance]);
  // ---------------

  return {
    loading,
    error,
    startAttempt,
    updateAnswer,
    submitAttempt,
    getHistory,
    getSubmissionsPaged,
    getAttemptsByStudent,
  };
};
