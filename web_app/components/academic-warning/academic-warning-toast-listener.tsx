"use client";

import { useAcademicWarningToast } from "@/hooks/academic-warning/useAcademicWarningToast";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Renders nothing but hooks into the SignalR notification hub to display
 * global toasts when academic warning jobs complete.
 * Must be placed inside ToastProvider and UserProvider.
 */
export function AcademicWarningToastListener() {
  const { authTokens } = useAuth();
  useAcademicWarningToast(authTokens?.accessToken ?? null);
  return null;
}
