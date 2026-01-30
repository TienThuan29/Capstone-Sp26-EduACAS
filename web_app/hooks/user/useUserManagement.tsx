"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { UserProfile } from "@/types/user";

export interface GrantAccountPayload {
  email: string;
  roleNumber: string;
  fullname: string;
  role: string;
}

export interface UpdateUserPayload {
  fullname: string;
  roleNumber: string;
  role: string;
  isEnable: boolean;
}

export const useUserManagement = () => {
  const axiosInstance = useAxios();

  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    const response = await axiosInstance.get(Api.User.GET_ALL);
    if (response.data?.dataResponse) {
      console.log(response.data.dataResponse);
      return response.data.dataResponse;
    }
    return [];
  }, [axiosInstance]);

  const grantAccount = useCallback(
    async (payload: GrantAccountPayload) => {
      const response = await axiosInstance.post(Api.Auth.GRANT_ACCOUNT, payload);
      return response.data;
    },
    [axiosInstance],
  );

  const updateUser = useCallback(
    async (id: string, payload: UpdateUserPayload) => {
      const response = await axiosInstance.put(Api.User.UPDATE(id), payload);
      return response.data;
    },
    [axiosInstance],
  );

  return {
    getAllUsers,
    grantAccount,
    updateUser,
  };
};
