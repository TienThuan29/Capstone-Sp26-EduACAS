"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import {
  ClassroomQuiz,
  ClassroomQuizStatus,
  CreateClassroomQuizRequest,
  UpdateClassroomQuizRequest,
} from "@/types/quiz";

function normalizeQuiz(data: any): ClassroomQuiz {
  return data as ClassroomQuiz;
}

export const useClassroomQuiz = () => {
  const axiosInstance = useAxios();

  const getClassroomQuizzesByClassroom = useCallback(
    async (classroomId: string): Promise<ClassroomQuiz[]> => {
      const response = await axiosInstance.get(
        Api.ClassroomQuiz.GET_BY_CLASSROOM(classroomId)
      );
      const list = response.data?.dataResponse ?? [];
      return Array.isArray(list) ? list.map((item: Record<string, unknown>) => normalizeQuiz(item)) : [];
    },
    [axiosInstance]
  );

  const getClassroomQuizById = useCallback(
    async (id: string): Promise<ClassroomQuiz | null> => {
      const response = await axiosInstance.get(
        Api.ClassroomQuiz.GET_BY_ID(id)
      );
      const data = response.data?.dataResponse;
      return data ? normalizeQuiz(data) : null;
    },
    [axiosInstance]
  );

  const createClassroomQuiz = useCallback(
    async (payload: CreateClassroomQuizRequest): Promise<ClassroomQuiz> => {
      const response = await axiosInstance.post(
        Api.ClassroomQuiz.CREATE,
        payload
      );
      return normalizeQuiz(response.data?.dataResponse);
    },
    [axiosInstance]
  );

  const updateClassroomQuiz = useCallback(
    async (
      id: string,
      payload: UpdateClassroomQuizRequest
    ): Promise<ClassroomQuiz> => {
      const response = await axiosInstance.put(
        Api.ClassroomQuiz.UPDATE(id),
        payload
      );
      return normalizeQuiz(response.data?.dataResponse);
    },
    [axiosInstance]
  );

  const softDeleteClassroomQuiz = useCallback(
    async (id: string): Promise<void> => {
      await axiosInstance.patch(Api.ClassroomQuiz.SOFT_DELETE(id));
    },
    [axiosInstance]
  );

  const deleteClassroomQuiz = useCallback(
    async (id: string): Promise<void> => {
      await axiosInstance.delete(Api.ClassroomQuiz.DELETE(id));
    },
    [axiosInstance]
  );

  return {
    getClassroomQuizzesByClassroom,
    getClassroomQuizById,
    createClassroomQuiz,
    updateClassroomQuiz,
    softDeleteClassroomQuiz,
    deleteClassroomQuiz,
  };
};
