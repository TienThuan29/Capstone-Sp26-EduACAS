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

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const useUserManagement = () => {
  const axiosInstance = useAxios();

  const getPagedUsers = useCallback(async (
    pageIndex: number = 1, 
    pageSize: number = 10, 
    searchTerm: string = "", 
    role: string = "all", 
    status: string = "all"
  ): Promise<PagedResult<UserProfile>> => {
    let url = `${Api.User.GET_PAGED}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
    if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    if (role && role !== 'all') url += `&role=${role}`;
    if (status && status !== 'all') {
      const isEnable = status === 'active';
      url += `&isEnable=${isEnable}`;
    }

    const response = await axiosInstance.get(url);
    if (response.data?.dataResponse) {
      return response.data.dataResponse;
    }
    return {
      items: [],
      totalCount: 0,
      pageIndex,
      pageSize,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    };
  }, [axiosInstance]);

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
    getPagedUsers,
    grantAccount,
    updateUser,
  };
};
