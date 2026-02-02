"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";

export const useExamination = () => {
  const axiosInstance = useAxios();

  const getExaminationsByClassId = useCallback(
    async (classId: string) => {
      const response = await axiosInstance.get(
        `${Api.Examination.GET_BY_CLASS}/${classId}`,
      );
      return response.data?.dataResponse || [];
    },
    [axiosInstance],
  );

  return {
    getExaminationsByClassId,
  };
};
