"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { ProgrammingLanguage } from "@/types/language";

export const useProgrammingLanguage = () => {
  const axiosInstance = useAxios();

  const getAllProgrammingLanguages = useCallback(async (): Promise<ProgrammingLanguage[]> => {
    const response = await axiosInstance.get(Api.ProgrammingLanguage.GET_ALL);
    if (response.data?.dataResponse) {
      // console.log("Fetched programming languages:", response.data.dataResponse);
      return response.data.dataResponse;
    }
    return [];
  }, [axiosInstance]);

  const syncProgrammingLanguages = useCallback(async (): Promise<ProgrammingLanguage[]> => {
    const response = await axiosInstance.post(Api.ProgrammingLanguage.SYNC);
    if (response.data?.dataResponse) {
      return response.data.dataResponse;
    }
    return [];
  }, [axiosInstance]);

  return {
    getAllProgrammingLanguages,
    syncProgrammingLanguages,
  };
};
