"use client";

import { useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import { Api } from "@/configs/api";

/**
 * Hook for private S3 operations: upload and get presigned file URL.
 */
export function usePrivateS3() {
  const axiosInstance = useAxios();

  /**
   * Uploads a file to private S3. Returns the stored filename (S3 key) on success.
   * @throws Error or axios error on failure
   */
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("File", file);

      const response = await axiosInstance.post(
        Api.S3.PRIVATE_UPLOAD,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const fileName = response.data?.dataResponse?.url;
      if (typeof fileName !== "string" || !fileName) {
        throw new Error("Upload succeeded but no file name returned.");
      }
      return fileName;
    },
    [axiosInstance],
  );

  /**
   * Gets a presigned URL for a private S3 file by filename (S3 key).
   * Returns the URL string; use it to download or display the file.
   * @throws Error or axios error on failure
   */
  const getFileUrl = useCallback(
    async (filename: string): Promise<string> => {
      const response = await axiosInstance.get(
        Api.S3.PRIVATE_GET_FILE_URL(filename),
      );

      const url = response.data?.dataResponse?.url;
      if (typeof url !== "string" || !url) {
        throw new Error("No file URL returned.");
      }
      return url;
    },
    [axiosInstance],
  );

  return { uploadFile, getFileUrl };
}
