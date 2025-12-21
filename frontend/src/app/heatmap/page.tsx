"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect page - forwards /heatmap to /heatmap-enhanced
 * The enhanced version has all features including AI insights, advanced filtering, and statistics
 */
export default function HeatmapRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/heatmap-enhanced");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#050814]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
        <p className="text-white/60">Redirecting to enhanced heatmap...</p>
      </div>
    </div>
  );
}
