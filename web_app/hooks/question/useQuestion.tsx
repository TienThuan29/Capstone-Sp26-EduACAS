"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { Question, QuestionType } from "@/types/question";

export interface CreateAnswerOptionPayload {
  content: string;
  isCorrect: boolean;
}

export interface CreateQuestionPayload {
  content: string;
  imageUrl?: string;
  type: QuestionType;
  createdBy: string;
  answerOptions: CreateAnswerOptionPayload[];
  textAnswer?: string;
}

export interface UpdateQuestionPayload {
  content?: string;
  imageUrl?: string;
  type?: QuestionType;
  answerOptions?: CreateAnswerOptionPayload[];
  textAnswer?: string;
}

export interface PagedQuestionResult {
  items: Question[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export const useQuestion = () => {
  const axiosInstance = useAxios();

  const getAllQuestions = useCallback(
    async (includeDeleted = false): Promise<Question[]> => {
      const response = await axiosInstance.get(Api.Question.GET_ALL, {
        params: { includeDeleted },
      });
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance],
  );

  const getQuestionsPaged = useCallback(
    async (
      pageIndex = 1,
      pageSize = 10,
      includeDeleted = false,
      searchTerm?: string,
      type?: string,
    ): Promise<PagedQuestionResult> => {
      const params: Record<string, string | number | boolean> = {
        pageIndex,
        pageSize,
        includeDeleted,
      };

      if (searchTerm != null && searchTerm.trim() !== "") {
        params.searchTerm = searchTerm.trim();
      }
      if (type != null && type !== "ALL") {
        params.type = type;
      }

      const response = await axiosInstance.get(Api.Question.GET_PAGED, { params });
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

  const getQuestionById = useCallback(
    async (id: string): Promise<Question | null> => {
      const response = await axiosInstance.get(Api.Question.GET_BY_ID(id));
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance],
  );

  const createQuestion = useCallback(
    async (payload: CreateQuestionPayload) => {
      const response = await axiosInstance.post(Api.Question.CREATE, payload);
      return response.data;
    },
    [axiosInstance],
  );

  const updateQuestion = useCallback(
    async (id: string, payload: UpdateQuestionPayload) => {
      const response = await axiosInstance.put(Api.Question.UPDATE(id), payload);
      return response.data;
    },
    [axiosInstance],
  );

  const softDeleteQuestion = useCallback(
    async (id: string) => {
      const response = await axiosInstance.patch(Api.Question.SOFT_DELETE(id));
      return response.data;
    },
    [axiosInstance],
  );

  const restoreQuestion = useCallback(
    async (id: string) => {
      const response = await axiosInstance.patch(Api.Question.RESTORE(id));
      return response.data;
    },
    [axiosInstance],
  );

  const deleteQuestion = useCallback(
    async (id: string) => {
      const response = await axiosInstance.delete(Api.Question.DELETE(id));
      return response.data;
    },
    [axiosInstance],
  );

  return {
    getAllQuestions,
    getQuestionsPaged,
    getQuestionById,
    createQuestion,
    updateQuestion,
    softDeleteQuestion,
    restoreQuestion,
    deleteQuestion,
  };
};
