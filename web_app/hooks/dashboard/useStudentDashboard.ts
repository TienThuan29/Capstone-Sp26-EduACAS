"use client";

import { useCallback, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type {
  StudentDashboardOverview,
  StudentExamScore,
  StudentWarning,
  StudentScoreTrend,
  StudentSubmissionStats,
} from "@/types/dashboard/StudentDashboardStats";

export const useStudentDashboard = (classroomId?: string, studentId?: string) => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOverview = useCallback(
    async (): Promise<StudentDashboardOverview | null> => {
      if (!classroomId || !studentId) return null;

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_STUDENT_OVERVIEW(classroomId),
          { params: { studentId } }
        );
        // console.log(response.data);
        return response.data?.dataResponse || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch overview");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId, studentId]
  );

  const getExamScores = useCallback(
    async (): Promise<StudentExamScore[]> => {
      if (!classroomId || !studentId) return [];

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_STUDENT_EXAM_SCORES(classroomId),
          { params: { studentId } }
        );
        console.log(response.data);
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch exam scores"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId, studentId]
  );

  const getWarnings = useCallback(
    async (limit: number = 10): Promise<StudentWarning[]> => {
      if (!classroomId || !studentId) return [];

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_STUDENT_WARNINGS(classroomId),
          { params: { studentId, limit } }
        );
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch warnings"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId, studentId]
  );

  const getScoreTrend = useCallback(
    async (): Promise<StudentScoreTrend[]> => {
      if (!classroomId || !studentId) return [];

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_STUDENT_SCORE_TREND(classroomId),
          { params: { studentId } }
        );
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch score trend"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId, studentId]
  );

  const getSubmissionStats = useCallback(
    async (): Promise<StudentSubmissionStats | null> => {
      if (!classroomId || !studentId) return null;

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_STUDENT_SUBMISSION_STATS(classroomId),
          { params: { studentId } }
        );
        return response.data?.dataResponse || null;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch submission stats"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId, studentId]
  );

  return {
    loading,
    error,
    getOverview,
    getExamScores,
    getWarnings,
    getScoreTrend,
    getSubmissionStats,
  };
};