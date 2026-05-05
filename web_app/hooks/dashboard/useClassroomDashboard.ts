"use client";

import { useCallback, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type {
  ScoreDistribution,
  AtRiskStudent,
  RecentWarning,
  ClassStats,
  ExamScoreStatistics,
} from "@/types/dashboard/DashboardStats";

export const useClassroomDashboard = (classroomId?: string) => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getScoreDistribution = useCallback(
    async (classroomIdParam?: string, mode?: string): Promise<ScoreDistribution[]> => {
      const targetClassroomId = classroomIdParam || classroomId;

      if (!targetClassroomId) {
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_DASHBOARD_SCORE_DISTRIBUTION(targetClassroomId, mode)
        );
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch score distribution"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId]
  );

  const getAtRiskStudents = useCallback(
    async (limit: number = 10): Promise<AtRiskStudent[]> => {
      if (!classroomId) {
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_DASHBOARD_AT_RISK(classroomId),
          { params: { limit } }
        );
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch at-risk students"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId]
  );

  const getRecentWarnings = useCallback(
    async (limit: number = 10): Promise<RecentWarning[]> => {
      if (!classroomId) {
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_DASHBOARD_WARNINGS(classroomId),
          { params: { limit, sortBy: "createdAt", sortOrder: "desc" } }
        );
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch recent warnings"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId]
  );

  const getClassStats = useCallback(
    async (classroomIdParam?: string): Promise<ClassStats[]> => {
      const targetClassroomId = classroomIdParam || classroomId;

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_CLASS_STATS,
          { params: { classroomId: targetClassroomId || undefined } }
        );
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch class stats"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId]
  );

  const getExamStatistics = useCallback(
    async (classroomIdParam?: string, examId?: string, mode?: string): Promise<ExamScoreStatistics[]> => {
      const targetClassroomId = classroomIdParam || classroomId;

      if (!targetClassroomId) {
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          Api.Classroom.GET_EXAM_STATISTICS(targetClassroomId, mode),
          { params: { examId: examId || undefined } }
        );
        return response.data?.dataResponse || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch exam statistics"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance, classroomId]
  );

  return {
    loading,
    error,
    getScoreDistribution,
    getAtRiskStudents,
    getRecentWarnings,
    getClassStats,
    getExamStatistics,
  };
};
