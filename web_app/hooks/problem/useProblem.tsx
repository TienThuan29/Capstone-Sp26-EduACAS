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
  isRemovedSpace: boolean;
};

export type CreateProblemPayload = {
  lecturerId: string;
  title: string;
  content: string;
  fileName: string;
  difficulty: Difficulty;
  codeTemplate: string;
  testCases?: CreateTestCasePayload[];
};

export type UpdateProblemPayload = {
  title: string;
  content: string;
  fileName: string;
  difficulty: Difficulty;
  codeTemplate: string;
  testCases?: CreateTestCasePayload[];
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

  return {
    // getAllProblems,
    getProblemsByLecturerId,
    getProblemById,
    createProblem,
    updateProblem,
    deleteProblem,
  };
};
