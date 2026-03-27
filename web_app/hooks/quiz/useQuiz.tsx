"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { Quiz } from "@/types/quiz";

export interface CreateQuizPayload {
  subjectId: string;
  title: string;
  duration: number;
  createdBy: string;
}

export interface UpdateQuizPayload {
  title?: string;
  duration?: number;
}

export interface AssignQuizQuestionPayload {
  questionId: string;
  marks: number;
  displayOrder: number;
}

export interface PagedQuizResult {
  items: Quiz[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export const useQuiz = () => {
  const axiosInstance = useAxios();

  const getAllQuizzes = useCallback(
    async (includeDeleted = false): Promise<Quiz[]> => {
      const response = await axiosInstance.get(Api.Quiz.GET_ALL, {
        params: { includeDeleted },
      });
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance],
  );

  const getQuizzesPaged = useCallback(
    async (
      pageIndex = 1,
      pageSize = 10,
      includeDeleted = false,
      searchTerm?: string,
      subjectId?: string,
    ): Promise<PagedQuizResult> => {
      const params: Record<string, string | number | boolean> = {
        pageIndex,
        pageSize,
        includeDeleted,
      };

      if (searchTerm != null && searchTerm.trim() !== "") {
        params.searchTerm = searchTerm.trim();
      }
      if (subjectId != null && subjectId !== "ALL") {
        params.subjectId = subjectId;
      }

      const response = await axiosInstance.get(Api.Quiz.GET_PAGED, { params });
      const data = response.data?.dataResponse;

      if (!data || typeof data !== "object") {
        return {
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 10,
          totalPages: 0,
        };
      }

      return {
        items: Array.isArray(data.items) ? data.items : [],
        totalCount: Number(data.totalCount) ?? 0,
        pageIndex: Number(data.pageIndex) ?? 1,
        pageSize: Number(data.pageSize) ?? 10,
        totalPages: Number(data.totalPages) ?? 0,
      };
    },
    [axiosInstance],
  );

  const getQuizById = useCallback(
    async (id: string): Promise<Quiz | null> => {
      const response = await axiosInstance.get(Api.Quiz.GET_BY_ID(id));
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance],
  );

  const createQuiz = useCallback(
    async (payload: CreateQuizPayload) => {
      const response = await axiosInstance.post(Api.Quiz.CREATE, payload);
      return response.data;
    },
    [axiosInstance],
  );

  const updateQuiz = useCallback(
    async (id: string, payload: UpdateQuizPayload) => {
      const response = await axiosInstance.put(Api.Quiz.UPDATE(id), payload);
      return response.data;
    },
    [axiosInstance],
  );

  const softDeleteQuiz = useCallback(
    async (id: string) => {
      const response = await axiosInstance.patch(Api.Quiz.SOFT_DELETE(id));
      return response.data;
    },
    [axiosInstance],
  );

  const restoreQuiz = useCallback(
    async (id: string) => {
      const response = await axiosInstance.patch(Api.Quiz.RESTORE(id));
      return response.data;
    },
    [axiosInstance],
  );

  const assignQuestionsToQuiz = useCallback(
    async (id: string, questions: AssignQuizQuestionPayload[]) => {
      const response = await axiosInstance.put(Api.Quiz.ASSIGN_QUESTIONS(id), {
        questions,
      });
      return response.data;
    },
    [axiosInstance],
  );

  const deleteQuiz = useCallback(
    async (id: string) => {
      const response = await axiosInstance.delete(Api.Quiz.DELETE(id));
      return response.data;
    },
    [axiosInstance],
  );

  return {
    getAllQuizzes,
    getQuizzesPaged,
    getQuizById,
    createQuiz,
    updateQuiz,
    softDeleteQuiz,
    restoreQuiz,
    assignQuestionsToQuiz,
    deleteQuiz,
  };
};
