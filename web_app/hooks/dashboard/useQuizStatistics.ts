"use client";

import { useCallback, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { QuizScoreStatistics } from "@/types/dashboard/DashboardStats";

export const useQuizStatistics = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuizStatistics = useCallback(
    async (classroomId: string): Promise<QuizScoreStatistics[]> => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get<{ dataResponse: QuizScoreStatistics[] }>(
          Api.Classroom.GET_QUIZ_STATISTICS(classroomId)
        );
        return response.data?.dataResponse ?? [];
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch quiz statistics";
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  return {
    loading,
    error,
    getQuizStatistics,
  };
};
