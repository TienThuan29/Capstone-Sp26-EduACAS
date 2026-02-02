"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { Examination, ExaminationRequest } from "@/types/examination";

export const useExamination = () => {
  const axiosInstance = useAxios();

  const getExaminationsByClassId = useCallback(
    async (classId: string): Promise<Examination[]> => {
      const response = await axiosInstance.get(
        `${Api.Examination.GET_BY_CLASS}/${classId}`,
      );
      return response.data?.dataResponse || [];
    },
    [axiosInstance],
  );

  const getExaminationById = useCallback(
    async (id: string): Promise<Examination | null> => {
      const response = await axiosInstance.get(Api.Examination.GET_BY_ID(id));
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance],
  );

  const createExamination = useCallback(
    async (payload: ExaminationRequest): Promise<Examination> => {
      const response = await axiosInstance.post(
        Api.Examination.CREATE,
        payload,
      );
      return response.data?.dataResponse;
    },
    [axiosInstance],
  );

  const updateExamination = useCallback(
    async (id: string, payload: ExaminationRequest): Promise<Examination> => {
      const response = await axiosInstance.put(
        Api.Examination.UPDATE(id),
        payload,
      );
      return response.data?.dataResponse;
    },
    [axiosInstance],
  );

  const deleteExamination = useCallback(
    async (id: string): Promise<void> => {
      await axiosInstance.delete(Api.Examination.DELETE(id));
    },
    [axiosInstance],
  );

  return {
    getExaminationsByClassId,
    getExaminationById,
    createExamination,
    updateExamination,
    deleteExamination,
  };
};
