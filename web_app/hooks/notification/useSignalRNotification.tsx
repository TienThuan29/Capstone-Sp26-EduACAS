"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Api } from "@/configs/api";
import type { RealtimeNotification } from "@/types/notification";

type ConnectionState = "Disconnected" | "Connecting" | "Connected" | "Reconnecting";

type UseSignalRNotificationOptions = {
  accessToken: string | null;
  onNotification?: (notification: RealtimeNotification) => void;
  enabled?: boolean;
};

/** True if the error is due to us stopping the connection (e.g. Strict Mode / unmount). */
function isAbortOrStoppedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("stopped during negotiation") ||
    msg.includes("Handshake was canceled") ||
    msg.includes("AbortError")
  );
}

/**
 * Connects to the SignalR notification hub and invokes onNotification when
 * a "ReceiveNotification" message is received. Automatically connects when
 * accessToken is set and disconnects when it is cleared.
 * Defers start to avoid React Strict Mode tearing down the connection during negotiation.
 */
export function useSignalRNotification({
  accessToken,
  onNotification,
  enabled = true,
}: UseSignalRNotificationOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const cancelledRef = useRef(false);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("Disconnected");
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const disconnect = useCallback(() => {
    const conn = connectionRef.current;
    if (conn) {
      connectionRef.current = null;
      setConnectionState("Disconnected");
      conn.stop().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!enabled || !accessToken) {
      disconnect();
      return;
    }

    cancelledRef.current = false;
    const baseUrl = Api.BASE_API || "";
    const hubUrl = baseUrl.replace(/\/$/, "") + Api.Notification.HUB;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken,
        // skipNegotiation: true,
        // transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveNotification", (payload: RealtimeNotification) => {
      onNotificationRef.current?.(payload);
    });

    connection.onreconnecting(() => {
      if (!cancelledRef.current) setConnectionState("Reconnecting");
    });
    connection.onreconnected(() => {
      if (!cancelledRef.current) setConnectionState("Connected");
    });
    connection.onclose(() => {
      if (!cancelledRef.current) setConnectionState("Disconnected");
    });

    connectionRef.current = connection;
    setConnectionState("Connecting");

    // Defer start so React Strict Mode cleanup can run first and we don't stop during negotiation
    startTimeoutRef.current = setTimeout(() => {
      startTimeoutRef.current = null;
      if (cancelledRef.current) return;
      connection
        .start()
        .then(() => {
          if (!cancelledRef.current) setConnectionState("Connected");
        })
        .catch((err) => {
          if (cancelledRef.current || isAbortOrStoppedError(err)) return;
          console.error("SignalR connection failed:", err);
          setConnectionState("Disconnected");
        });
    }, 0);

    return () => {
      cancelledRef.current = true;
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      connectionRef.current = null;
      connection.stop().catch(() => {});
    };
  }, [accessToken, enabled, disconnect]);

  return { connectionState, disconnect };
}
