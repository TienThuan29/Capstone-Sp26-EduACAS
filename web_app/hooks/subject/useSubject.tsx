"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";

export interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  createdBy?: string;
  isDeleted: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export const useSubject = () => {
  const axiosInstance = useAxios();

  const getAllSubjects = useCallback(
    async () => {
      const response = await axiosInstance.get(Api.Subject.GET_ALL);
      return response.data?.dataResponse || [];
    },
    [axiosInstance],
  );

  const getActiveSubjects = useCallback(
    async () => {
      const allSubjects = await getAllSubjects();
      return allSubjects.filter((subject: Subject) => !subject.isDeleted);
    },
    [getAllSubjects],
  );

  return {
    getAllSubjects,
    getActiveSubjects,
  };
};
