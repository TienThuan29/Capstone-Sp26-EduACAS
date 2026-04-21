"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { PublicStatistics } from "@/types/public-statistics";

export const usePublicStatistics = () => {
  const axiosInstance = useAxios();

  const getPublicStatistics = useCallback(async (): Promise<PublicStatistics> => {
    const response = await axiosInstance.get(Api.PublicStatistics.GET);
    if (response.data?.dataResponse) {
      return response.data.dataResponse;
    }
    throw new Error("Failed to fetch public statistics");
  }, [axiosInstance]);

  return {
    getPublicStatistics,
  };
};
