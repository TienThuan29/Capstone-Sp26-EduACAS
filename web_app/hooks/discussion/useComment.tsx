"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { DiscussionIssue } from "@/types/discussion";
import type {
  WriteCommentPayload,
  ReplyCommentPayload,
  UpvoteCommentPayload,
} from "@/hooks/discussion/useDiscussionIssue";

/** API response wrapper from backend ApiResponse<T> */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useComment = () => {
  const axiosInstance = useAxios();

  /** POST write a top-level comment. Returns updated issue with comments */
  const writeComment = useCallback(
    async (payload: WriteCommentPayload): Promise<DiscussionIssue | null> => {
      const response = await axiosInstance.post<ApiResponse<DiscussionIssue>>(
        Api.DiscussionIssue.WRITE_COMMENT,
        payload
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  /** POST reply to a comment. Returns updated issue with comments */
  const replyComment = useCallback(
    async (payload: ReplyCommentPayload): Promise<DiscussionIssue | null> => {
      const response = await axiosInstance.post<ApiResponse<DiscussionIssue>>(
        Api.DiscussionIssue.REPLY_COMMENT,
        payload
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  /** POST upvote a comment. Returns updated issue with comments. */
  const upvoteComment = useCallback(
    async (payload: UpvoteCommentPayload): Promise<DiscussionIssue | null> => {
      const response = await axiosInstance.post<ApiResponse<DiscussionIssue>>(
        Api.DiscussionIssue.UPVOTE_COMMENT,
        payload
      );
      return response.data?.dataResponse ?? null;
    },
    [axiosInstance]
  );

  return {
    writeComment,
    replyComment,
    upvoteComment,
  };
};
