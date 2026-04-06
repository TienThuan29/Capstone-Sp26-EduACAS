"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { ExaminationStatus, ExaminationMode } from "@/types/examination";

export interface ExaminationBasicResponse {
  id: string;
  examName: string;
  startDatetime: string;
  endDatetime: string;
  status: ExaminationStatus;
  mode: ExaminationMode;
}

export interface SlotResponse {
  id: string;
  classroomId: string;
  slotNumber: string;
  title: string;
  description: string;
  createdDate: string;
  examinationIds: string[];
  examinations: ExaminationBasicResponse[];
}

export type CreateSlotPayload = {
  classroomId: string;
  title: string;
  description: string;
};

export type UpdateSlotPayload = Partial<CreateSlotPayload> & {
  examinationIds?: string[];
};

export const useSlot = () => {
  const axiosInstance = useAxios();

  const getSlotsByClassroom = useCallback(
    async (classroomId: string) => {
      const response = await axiosInstance.get(
        Api.Slot.GET_BY_CLASSROOM(classroomId)
      );
      return (response.data?.dataResponse as SlotResponse[]) || [];
    },
    [axiosInstance]
  );

  const createSlot = useCallback(
    async (payload: CreateSlotPayload) => {
      const response = await axiosInstance.post(Api.Slot.CREATE, payload);
      return response.data;
    },
    [axiosInstance]
  );

  const createAllSlots = useCallback(
    async (classroomId: string) => {
      const response = await axiosInstance.post(
        Api.Slot.CREATE_ALL_SLOTS(classroomId)
      );
      return response.data;
    },
    [axiosInstance]
  );

  const updateSlot = useCallback(
    async (slotId: string, payload: UpdateSlotPayload) => {
      const response = await axiosInstance.put(
        Api.Slot.UPDATE(slotId),
        payload
      );
      return response.data;
    },
    [axiosInstance]
  );

  const deleteSlot = useCallback(
    async (slotId: string) => {
      const response = await axiosInstance.delete(Api.Slot.DELETE(slotId));
      return response.data;
    },
    [axiosInstance]
  );

  return {
    getSlotsByClassroom,
    createSlot,
    createAllSlots,
    updateSlot,
    deleteSlot,
  };
};
