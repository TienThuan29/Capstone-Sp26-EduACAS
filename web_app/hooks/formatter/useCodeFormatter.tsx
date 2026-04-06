'use client';

import { useState, useCallback } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import { FormatCodeResponse, FormatCodeParams} from '@/types/formatter';

export function useCodeFormatter() {
  const axiosInstance = useAxios();

  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formattedCode, setFormattedCode] = useState<string | null>(null);

  const formatCode = useCallback(async ({ source, lang }: FormatCodeParams) => {
    if (!source || !lang) {
      setError('Source code and language are required.');
      return null;
    }

    setIsFormatting(true);
    setError(null);
    setFormattedCode(null);

    try {
      const response = await axiosInstance.post<{
        success: boolean;
        dataResponse?: FormatCodeResponse;
        message?: string;
      }>(`${Api.Formatter.FORMAT}?lang=${encodeURIComponent(lang)}`, {
        source,
      });

      const data = response.data?.dataResponse;
      if (!data) {
        const msg = (response.data as { message?: string })?.message ?? 'No response data';
        setError(msg);
        return null;
      }

      if (data.code !== 0) {
        setError(data.stderr ?? 'Code formatting failed');
        return null;
      }

      setFormattedCode(data.formatted);
      return data.formatted;
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Request failed';
      setError(message ?? 'Request failed');
      return null;
    } finally {
      setIsFormatting(false);
    }
  }, [axiosInstance]);

  const reset = useCallback(() => {
    setFormattedCode(null);
    setError(null);
  }, []);

  return { formatCode, isFormatting, error, formattedCode, reset };
}
