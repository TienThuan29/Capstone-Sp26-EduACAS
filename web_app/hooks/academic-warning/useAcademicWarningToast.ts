"use client";

import { useEffect } from "react";
import { useSignalRNotification } from "@/hooks/notification/useSignalRNotification";
import { useToast } from "@/hooks/useToast";
import type { RealtimeNotification } from "@/types/notification";

/**
 * Listens for ACADEMIC_WARNING_JOB_COMPLETED SignalR notifications and displays
 * a global toast to the lecturer whenever a Send Warning background job finishes.
 *
 * Must be used within a ToastProvider (e.g. in RootLayout).
 */
export function useAcademicWarningToast(accessToken: string | null) {
  const { showSuccess, showError } = useToast();

  useSignalRNotification({
    accessToken,
    enabled: !!accessToken,
    onNotification: (payload: RealtimeNotification) => {
      if (payload.type !== "ACADEMIC_WARNING_JOB_COMPLETED") return;

      const emailsSent = payload.payload?.emailsSent as number | undefined;
      const totalProcessed = payload.payload?.totalProcessed as number | undefined;

      if (emailsSent !== undefined && totalProcessed !== undefined) {
        if (emailsSent === totalProcessed && totalProcessed > 0) {
          showSuccess(
            `${payload.body}`
          );
        } else {
          showError(
            `${payload.body}`
          );
        }
      } else {
        showSuccess(payload.body);
      }
    },
  });
}
