"use client";
import { useEffect } from "react";
import { useSmoothScroll } from "@/lib/smoothScroll";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cleanup = useSmoothScroll?.();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);
  return <>{children}</>;
}
