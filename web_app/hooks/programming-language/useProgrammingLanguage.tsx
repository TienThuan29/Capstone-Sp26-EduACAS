"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";

export interface ProgrammingLanguage {
  id: string;
  languageName: string;
  key: string;
  languageVersion: string;
  isEnable: boolean;
  createdDate: Date;
  updatedDate: Date;
}

export interface CreateProgrammingLanguagePayload {
  Key: string;
  LanguageName: string;
  LanguageVersion: string;
  IsEnable: boolean;
}

export interface UpdateProgrammingLanguagePayload {
  Key: string;
  LanguageName: string;
  LanguageVersion: string;
  IsEnable: boolean;
}

export const useProgrammingLanguage = () => {
  const axiosInstance = useAxios();

  const getAllProgrammingLanguages = useCallback(async (): Promise<ProgrammingLanguage[]> => {
    const response = await axiosInstance.get(Api.ProgrammingLanguage.GET_ALL);
    if (response.data?.dataResponse) {
      return response.data.dataResponse;
    }
    return [];
  }, [axiosInstance]);

  const createProgrammingLanguage = useCallback(
    async (payload: CreateProgrammingLanguagePayload) => {
      const response = await axiosInstance.post(Api.ProgrammingLanguage.CREATE, payload);
      return response.data;
    },
    [axiosInstance],
  );

  const updateProgrammingLanguage = useCallback(
    async (id: string, payload: UpdateProgrammingLanguagePayload) => {
      const response = await axiosInstance.put(Api.ProgrammingLanguage.UPDATE(id), payload);
      return response.data;
    },
    [axiosInstance],
  );

  const deleteProgrammingLanguage = useCallback(
    async (id: string) => {
      await axiosInstance.delete(Api.ProgrammingLanguage.DELETE(id));
    },
    [axiosInstance],
  );

  const toggleEnable = useCallback(
    async (id: string) => {
      await axiosInstance.put(Api.ProgrammingLanguage.TOGGLE_ENABLE(id));
    },
    [axiosInstance],
  );

  return {
    getAllProgrammingLanguages,
    createProgrammingLanguage,
    updateProgrammingLanguage,
    deleteProgrammingLanguage,
    toggleEnable,
  };
};
