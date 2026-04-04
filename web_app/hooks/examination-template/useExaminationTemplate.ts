"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { PagedResult } from "@/hooks/classroom/useClassroom";
import type {
  ExaminationTemplateResponse,
  CreateExaminationTemplatePayload,
  UpdateExaminationTemplatePayload,
} from "@/types/examination-template";

export const useExaminationTemplate = () => {
  const axiosInstance = useAxios();

  const getById = useCallback(
    async (id: string): Promise<ExaminationTemplateResponse | null> => {
      const response = await axiosInstance.get(
        Api.ExaminationTemplate.GET_BY_ID(id),
      );
      return response.data?.dataResponse || null;
    },
    [axiosInstance],
  );

  const getAll = useCallback(
    async (
      pageIndex: number = 1,
      pageSize: number = 10,
    ): Promise<PagedResult<ExaminationTemplateResponse>> => {
      const response = await axiosInstance.get(Api.ExaminationTemplate.GET_ALL, {
        params: { pageIndex, pageSize },
      });
      return (
        response.data?.dataResponse || {
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        }
      );
    },
    [axiosInstance],
  );

  const getByLecturerId = useCallback(
    async (
      lecturerId: string,
      pageIndex: number = 1,
      pageSize: number = 10,
    ): Promise<PagedResult<ExaminationTemplateResponse>> => {
      const response = await axiosInstance.get(
        Api.ExaminationTemplate.GET_BY_LECTURER(lecturerId),
        { params: { pageIndex, pageSize } },
      );
      return (
        response.data?.dataResponse || {
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        }
      );
    },
    [axiosInstance],
  );

  const create = useCallback(
    async (payload: CreateExaminationTemplatePayload) => {
      const response = await axiosInstance.post(
        Api.ExaminationTemplate.CREATE,
        payload,
      );
      return response.data;
    },
    [axiosInstance],
  );

  const update = useCallback(
    async (id: string, payload: UpdateExaminationTemplatePayload) => {
      const response = await axiosInstance.put(
        Api.ExaminationTemplate.UPDATE(id),
        payload,
      );
      return response.data;
    },
    [axiosInstance],
  );

  const softDelete = useCallback(
    async (id: string) => {
      const response = await axiosInstance.put(
        Api.ExaminationTemplate.SOFT_DELETE(id),
      );
      return response.data;
    },
    [axiosInstance],
  );

  const restore = useCallback(
    async (id: string) => {
      const response = await axiosInstance.put(
        Api.ExaminationTemplate.RESTORE(id),
      );
      return response.data;
    },
    [axiosInstance],
  );

  const hardDelete = useCallback(
    async (id: string) => {
      const response = await axiosInstance.delete(
        Api.ExaminationTemplate.DELETE(id),
      );
      return response.data;
    },
    [axiosInstance],
  );

  return {
    getById,
    getAll,
    getByLecturerId,
    create,
    update,
    softDelete,
    restore,
    hardDelete,
  };
};
