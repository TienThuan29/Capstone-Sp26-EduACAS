"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { QuizAttempt } from "@/types/quiz-attempt";

export const useQuizAttempt = () => {
  const axiosInstance = useAxios();

  const getAttemptsByStudent = useCallback(
    async (studentId: string): Promise<QuizAttempt[]> => {
      const response = await axiosInstance.get(Api.QuizAttempt.GET_BY_STUDENT(studentId));
      const list = response.data?.dataResponse ?? [];
      return Array.isArray(list) ? (list as QuizAttempt[]) : [];
    },
    [axiosInstance],
  );

  return {
    getAttemptsByStudent,
  };
};
