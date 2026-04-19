import { useState, useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import { PagedMaterials } from "@/types/material";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useAdminMaterial = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminMaterials = useCallback(
    async (searchTerm: string = "", pageIndex: number = 1, pageSize: number = 10) => {
      try {
        setLoading(true);
        setError(null);
        let url = `${Api.Material.GET_ADMIN}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
        if (searchTerm) {
          url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await axiosInstance.get<ApiResponse<PagedMaterials>>(url);
        return response.data?.dataResponse;
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to fetch materials";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const softDeleteMaterial = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await axiosInstance.patch(Api.Material.SOFT_DELETE(id));
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete material";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  const restoreMaterial = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await axiosInstance.patch(Api.Material.RESTORE(id));
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to restore material";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  return {
    getAdminMaterials,
    softDeleteMaterial,
    restoreMaterial,
    loading,
    error,
  };
};
