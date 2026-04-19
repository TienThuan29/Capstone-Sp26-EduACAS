import { useState, useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";
import type { Examination } from "@/types/examination";
import type {
  SubmissionResponse,
  ProblemSubmissionsResponse,
} from "@/types/submission";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  dataResponse?: T;
  error?: string;
}

export const useExaminationDetail = () => {
  const axiosInstance = useAxios();
  const [exam, setExam] = useState<Examination | null>(null);
  const [submissions, setSubmissions] = useState<ProblemSubmissionsResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchById = useCallback(
    async (examId: string): Promise<Examination | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<ApiResponse<Examination>>(
          Api.Examination.GET_BY_ID(examId)
        );
        const data = response.data?.dataResponse;
        if (data) setExam(data);
        return data ?? null;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to load examination";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const fetchSubmissionsByExam = useCallback(
    async (examId: string): Promise<ProblemSubmissionsResponse[]> => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<ApiResponse<ProblemSubmissionsResponse[]>>(
          Api.Examination.GET_LATEST_BY_EXAM(examId)
        );
        const data = response.data?.dataResponse ?? [];
        setSubmissions(data);
        return data;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to load submissions";
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance]
  );

  const loadDetail = useCallback(
    async (examId: string) => {
      await Promise.all([fetchById(examId), fetchSubmissionsByExam(examId)]);
    },
    [fetchById, fetchSubmissionsByExam]
  );

  return {
    exam,
    submissions,
    loading,
    error,
    fetchById,
    fetchSubmissionsByExam,
    loadDetail,
    setExam,
    setSubmissions,
  };
};
