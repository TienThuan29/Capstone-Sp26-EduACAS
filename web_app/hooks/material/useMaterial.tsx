"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { Material, CreateMaterialRequest, UpdateMaterialRequest } from "@/types/material";

export const useMaterial = () => {
  const axiosInstance = useAxios();

  const getMaterialsByClassroom = useCallback(
    async (classroomId: string): Promise<Material[]> => {
      const response = await axiosInstance.get(
        Api.Material.GET_BY_CLASSROOM(classroomId)
      );
      return response.data?.dataResponse || [];
    },
    [axiosInstance]
  );

  const createMaterial = useCallback(
    async (data: CreateMaterialRequest): Promise<Material> => {
      // Validate required fields
      if (!data.lecturerId) {
        throw new Error("Lecturer ID is required");
      }
      
      const formData = new FormData();
      formData.append("File", data.file);
      formData.append("ClassroomId", data.classroomId);
      formData.append("LecturerId", data.lecturerId);
      formData.append("Description", data.description || "");

      const response = await axiosInstance.post(
        Api.Material.CREATE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data?.dataResponse;
    },
    [axiosInstance]
  );

  const updateMaterial = useCallback(
    async (id: string, data: UpdateMaterialRequest): Promise<Material> => {
      const response = await axiosInstance.put(
        Api.Material.UPDATE(id),
        data
      );
      return response.data?.dataResponse;
    },
    [axiosInstance]
  );

  const deleteMaterial = useCallback(
    async (id: string): Promise<boolean> => {
      const response = await axiosInstance.delete(
        Api.Material.DELETE(id)
      );
      return response.data?.success || false;
    },
    [axiosInstance]
  );

  const softDeleteMaterial = useCallback(
    async (id: string): Promise<boolean> => {
      const response = await axiosInstance.patch(
        Api.Material.SOFT_DELETE(id)
      );
      return response.data?.success || false;
    },
    [axiosInstance]
  );

  return {
    getMaterialsByClassroom,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    softDeleteMaterial,
  };
};
