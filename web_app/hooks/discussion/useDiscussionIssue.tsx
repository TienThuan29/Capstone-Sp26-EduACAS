"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type {
  DiscussionIssue,
  DiscussionIssueStatus,
  PagedDiscussionIssues,
} from "@/types/discussion";

/** API response wrapper from backend ApiResponse<T> */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

/** Payload for creating a new discussion issue. */
export interface CreateIssuePayload {
  classroomId: string;
  authorId: string;
  title: string;
  content: string;
  refProblemId?: string;
}

/** Payload for writing a top-level comment. */
export interface WriteCommentPayload {
  issueId: string;
  authorId: string;
  content: string;
}

/** Payload for replying to a comment. */
export interface ReplyCommentPayload {
  issueId: string;
  parentCommentId: string;
  authorId: string;
  content: string;
}

/** Payload for upvoting a comment. */
export interface UpvoteCommentPayload {
  issueId: string;
  commentId: string;
}

export const useDiscussionIssue = () => {
  const axiosInstance = useAxios();

  /** GET paged list by classroomId */
  const getPagedByClassroom = useCallback(
    async (
      classroomId: string,
      pageIndex: number = 1,
      pageSize: number = 10
    ): Promise<PagedDiscussionIssues> => {
      const url = `${Api.DiscussionIssue.GET_PAGED}?classroomId=${encodeURIComponent(classroomId)}&pageIndex=${pageIndex}&pageSize=${pageSize}`;
      const response = await axiosInstance.get<ApiResponse<PagedDiscussionIssues>>(url);
      const data = response.data?.dataResponse;
      if (!data) {
        return {
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        };
      }
      return data;
    },
    [axiosInstance]
  );

  /** GET count by classroomId */
  const getCountByClassroom = useCallback(
    async (classroomId: string): Promise<number> => {
      const url = `${Api.DiscussionIssue.GET_COUNT}?classroomId=${encodeURIComponent(classroomId)}`;
      const response = await axiosInstance.get<ApiResponse<number>>(url);
      return response.data?.dataResponse ?? 0;
    },
    [axiosInstance]
  );

  /** GET single issue by id */
  const getById = useCallback(
    async (id: string): Promise<DiscussionIssue | null> => {
      const response = await axiosInstance.get<ApiResponse<DiscussionIssue>>(
        Api.DiscussionIssue.GET_BY_ID(id)
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  /** POST create issue */
  const createIssue = useCallback(
    async (payload: CreateIssuePayload): Promise<DiscussionIssue | null> => {
      const response = await axiosInstance.post<ApiResponse<DiscussionIssue>>(
        Api.DiscussionIssue.CREATE,
        payload
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  /** PATCH change status (lecturer/admin) */
  const changeStatus = useCallback(
    async (
      issueId: string,
      status: DiscussionIssueStatus
    ): Promise<DiscussionIssue | null> => {
      const response = await axiosInstance.patch<ApiResponse<DiscussionIssue>>(
        Api.DiscussionIssue.CHANGE_STATUS(issueId),
        { issueId, status }
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  /** PATCH soft-delete issue */
  const softDeleteIssue = useCallback(
    async (issueId: string): Promise<boolean> => {
      const response = await axiosInstance.patch<ApiResponse<boolean>>(
        Api.DiscussionIssue.SOFT_DELETE(issueId)
      );
      return response.data?.success === true;
    },
    [axiosInstance]
  );

  return {
    getPagedByClassroom,
    getCountByClassroom,
    getById,
    createIssue,
    changeStatus,
    softDeleteIssue,
  };
};
