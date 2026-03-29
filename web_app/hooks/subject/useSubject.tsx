"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { Subject } from "@/types/subject";

export interface CreateSubjectPayload {
  subjectCode: string;
  subjectName: string;
  description: string;
  createdBy: string;
  isDeleted?: boolean;
}

export interface UpdateSubjectPayload {
  subjectCode: string;
  subjectName: string;
  description: string;
  createdBy: string;
  isDeleted: boolean;
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

  const createSubject = useCallback(
    async (payload: CreateSubjectPayload) => {
      const response = await axiosInstance.post(Api.Subject.CREATE, payload);
      return response.data;
    },
    [axiosInstance],
  );

  const updateSubject = useCallback(
    async (id: string, payload: UpdateSubjectPayload) => {
      const response = await axiosInstance.put(Api.Subject.UPDATE(id), payload);
      return response.data;
    },
    [axiosInstance],
  );

  const softDeleteSubject = useCallback(
    async (id: string) => {
      const response = await axiosInstance.patch(Api.Subject.SOFT_DELETE(id));
      return response.data;
    },
    [axiosInstance],
  );

  const restoreSubject = useCallback(
    async (id: string) => {
      const response = await axiosInstance.patch(Api.Subject.RESTORE(id));
      return response.data;
    },
    [axiosInstance],
  );

  const getSubjectById = useCallback(
    async (id: string) => {
      const response = await axiosInstance.get(Api.Subject.GET_BY_ID(id));
      return response.data?.dataResponse || null;
    },
    [axiosInstance],
  );

  return {
    getAllSubjects,
    getActiveSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    softDeleteSubject,
    restoreSubject,
  };
};
