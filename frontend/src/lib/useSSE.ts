import { useEffect, useRef } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export function useSSE(path: string, onMessage: (ev: MessageEvent) => void) {
  const esRef = useRef<EventSource | null>(null);

  const openConnection = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("campuscare_token")
        : null;
    const separator = path.includes("?") ? "&" : "?";
    const url = `${API_BASE_URL}${path}${separator}token=${encodeURIComponent(token || "")}`;

    // Close existing
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(url);
    es.onmessage = onMessage;
    es.onerror = (err) => {
      console.warn("SSE error:", err);
      // If unauthorized/connection lost, we'll rely on token refresh event to reconnect
    };

    esRef.current = es;
  };

  useEffect(() => {
    openConnection();

    const onTokenRefreshed = () => {
      console.log("Token refreshed, reconnecting SSE...");
      openConnection();
    };

    window.addEventListener(
      "campuscare:token_refreshed",
      onTokenRefreshed as EventListener,
    );

    return () => {
      window.removeEventListener(
        "campuscare:token_refreshed",
        onTokenRefreshed as EventListener,
      );
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return esRef;
}
