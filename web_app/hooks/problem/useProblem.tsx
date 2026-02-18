"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type {
  ProblemResponse,
  ProblemBasicResponse,
  Difficulty,
} from "@/types/problem";

export type CreateTestCasePayload = {
  inputData: string;
  expectedOutput: string;
  isPublic: boolean;
  isCaseInsensitive: boolean;
  isFloatingPoint: boolean;
  floatingPointTolerance: number | null;
  decimalPlaces: number | null;
  isTokenComparision: boolean | null;
  isNotOrderedComparision: boolean | null;
};

export type CreateProblemPayload = {
  lecturerId: string;
  title: string;
  content: string;
  fileName: string;
  difficulty: Difficulty;
  codeTemplates?: Record<string, string>;
  testCases?: CreateTestCasePayload[];
  mode: string;
  wantsToEdit?: boolean;
  tags?: string[];
};

export type UpdateProblemPayload = {
  title: string;
  content: string;
  fileName: string;
  difficulty: Difficulty;
  codeTemplates?: Record<string, string>;
  testCases?: CreateTestCasePayload[];
  tags?: string[];
};


export const useProblem = () => {
  const axiosInstance = useAxios();

  // const getAllProblems = useCallback(async (): Promise<ProblemBasicResponse[]> => {
  //   const response = await axiosInstance.get(Api.Problem.GET_ALL);
  //   return response.data?.dataResponse ?? [];
  // }, [axiosInstance]);

  const getProblemsByLecturerId = useCallback(
    async (lecturerId: string): Promise<ProblemBasicResponse[]> => {
      const response = await axiosInstance.get(Api.Problem.GET_BY_LECTURER(lecturerId));
      return response.data?.dataResponse ?? [];
    },
    [axiosInstance],
  );

  const getProblemById = useCallback(
    async (id: string): Promise<ProblemResponse | null> => {
      const response = await axiosInstance.get(Api.Problem.GET_BY_ID(id));
      const data = response.data?.dataResponse;
      return data ?? null;
    },
    [axiosInstance],
  );

  const createProblem = useCallback(
    async (payload: CreateProblemPayload) => {
      const response = await axiosInstance.post(Api.Problem.CREATE, payload);
      return response.data;
    },
    [axiosInstance],
  );

  const updateProblem = useCallback(
    async (id: string, payload: UpdateProblemPayload) => {
      const response = await axiosInstance.put(Api.Problem.UPDATE(id), payload);
      return response.data;
    },
    [axiosInstance],
  );

  const deleteProblem = useCallback(
    async (id: string) => {
      const response = await axiosInstance.delete(Api.Problem.DELETE(id));
      return response.data;
    },
    [axiosInstance],
  );

  const extractOcrContent = useCallback(
    async (fileName: string): Promise<string> => {
      try {
        const response = await axiosInstance.post(
          Api.Problem.OCR_EXTRACT,
          { fileName }
        );

        const content = response.data?.dataResponse?.content;

        if (typeof content !== 'string') {
          throw new Error('Invalid OCR response format');
        }

        return content;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('OCR extraction failed:', error);
        throw new Error(error.response?.data?.message || 'Failed to extract content from file');
      }
    },
    [axiosInstance]
  );

  return {
    // getAllProblems,
    getProblemsByLecturerId,
    getProblemById,
    createProblem,
    updateProblem,
    deleteProblem,
    extractOcrContent,
  };
};
