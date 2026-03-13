"use client";

import { useState, useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { TestCaseResponse } from "@/types/problem";

type TestcaseGenerationPreviewPayload = {
  content: string;
  numberOfTestcases: number;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
};

export const useTestcaseGeneration = () => {
  const axiosInstance = useAxios();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testcases, setTestcases] = useState<TestCaseResponse[] | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const generatePreview = useCallback(
    async (content: string, numberOfTestcases: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const payload: TestcaseGenerationPreviewPayload = {
          content,
          numberOfTestcases,
        };

        const response = await axiosInstance.post<ApiResponse<TestCaseResponse[]>>(
          Api.TestcaseGeneration.PREVIEW,
          payload
        );

        const res = response.data;
        const data = res?.dataResponse;

        if (!res?.success || !Array.isArray(data)) {
          const msg = res?.message ?? res?.error ?? "Failed to generate testcases";
          setError(msg);
          setTestcases(null);
          throw new Error(msg);
        }

        setTestcases(data);
        setLastMessage(res?.message ?? null);
        return data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const message =
          err?.response?.data?.message ??
          err?.response?.data?.error ??
          err?.message ??
          "Request failed";

        setError(message);
        setTestcases(null);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [axiosInstance]
  );

  return {
    generatePreview,
    isLoading,
    error,
    testcases,
    lastMessage,
  };
};

