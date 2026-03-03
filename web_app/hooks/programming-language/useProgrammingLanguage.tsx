"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { ProgrammingLanguage } from "@/types/language";

interface UpdateProgrammingLanguageRequest {
  status: string;
}

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

  const getEnabledProgrammingLanguages = useCallback(async (): Promise<ProgrammingLanguage[]> => {
    const response = await axiosInstance.get(Api.ProgrammingLanguage.GET_ENABLED);
    if (response.data?.dataResponse) {
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

  const updateProgrammingLanguage = useCallback(async (id: string, data: UpdateProgrammingLanguageRequest): Promise<ProgrammingLanguage> => {
    const response = await axiosInstance.put(Api.ProgrammingLanguage.UPDATE_STATUS(id), data);
    if (response.data?.dataResponse) {
      return response.data.dataResponse;
    }
    throw new Error('Failed to update programming language');
  }, [axiosInstance]);

  const updateCompilerName = useCallback(async (languageId: string, compilerId: string, name: string): Promise<ProgrammingLanguage> => {
    const response = await axiosInstance.put(Api.ProgrammingLanguage.UPDATE_COMPILER_NAME(languageId, compilerId), { name });
    if (response.data?.dataResponse) {
      return response.data.dataResponse;
    }
    throw new Error('Failed to update compiler name');
  }, [axiosInstance]);

  return {
    getAllProgrammingLanguages,
    getEnabledProgrammingLanguages,
    syncProgrammingLanguages,
    updateProgrammingLanguage,
    updateCompilerName,
  };
};
