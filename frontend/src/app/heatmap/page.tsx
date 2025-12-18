"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HeatmapContainer } from "@/components/heatmap/HeatmapContainer";
import { FloatingNav } from "@/components/landing/FloatingNav";

// Dynamically import the map container to avoid SSR issues with Leaflet
const DynamicHeatmapContainer = dynamic(
  () => import("@/components/heatmap/HeatmapContainer").then((mod) => ({ default: mod.HeatmapContainer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-[#050814]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
          <p className="text-white/60">Loading heatmap...</p>
        </div>
      </div>
    ),
  }
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  issueCount?: number;
  avgSeverity?: number;
  categories?: string[];
}

export default function HeatmapPage() {
  const router = useRouter();
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default campus bounds (GGV Bilaspur, India - adjust to your campus)
  const campusCenter: [number, number] = [22.0754, 82.1564]; // Bilaspur, Chhattisgarh
  const campusBounds: [[number, number], [number, number]] = [
    [22.065, 82.146], // Southwest
    [22.085, 82.166], // Northeast
  ];

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token
      const token = typeof window !== "undefined" ? window.localStorage.getItem("ciis_token") : null;
      const userStr = typeof window !== "undefined" ? window.localStorage.getItem("ciis_user") : null;

      if (!token || !userStr) {
        // Not authenticated - use placeholder data
        setHeatmapData(generatePlaceholderData());
        setIsLoading(false);
        return;
      }

      let user;
      try {
        user = JSON.parse(userStr);
      } catch {
        setHeatmapData(generatePlaceholderData());
        setIsLoading(false);
        return;
      }

      // Fetch from backend API
      const response = await fetch(
        `${API_BASE_URL}/api/heatmap/data?organizationId=${user.organizationId || "ggv-bilaspur"}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch heatmap data");
      }

      const result = await response.json();

      if (result.success && result.data?.features) {
        // Convert GeoJSON features to heatmap points
        const points: HeatmapPoint[] = result.data.features.map((feature: any) => ({
          lat: feature.geometry.coordinates[1], // GeoJSON uses [lng, lat]
          lng: feature.geometry.coordinates[0],
          intensity: feature.properties.weight || feature.properties.intensity || 0.5,
          issueCount: feature.properties.issueCount,
          avgSeverity: feature.properties.avgSeverity,
          categories: feature.properties.categories || [],
        }));

        setHeatmapData(points);
      } else {
        // Fallback to placeholder data
        setHeatmapData(generatePlaceholderData());
      }
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
      setError(err instanceof Error ? err.message : "Failed to load heatmap");
      // Use placeholder data on error
      setHeatmapData(generatePlaceholderData());
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlaceholderData = (): HeatmapPoint[] => {
    // Generate sample data around campus center
    const points: HeatmapPoint[] = [];
    for (let i = 0; i < 50; i++) {
      const latOffset = (Math.random() - 0.5) * 0.02; // ~2km spread
      const lngOffset = (Math.random() - 0.5) * 0.02;
      points.push({
        lat: campusCenter[0] + latOffset,
        lng: campusCenter[1] + lngOffset,
        intensity: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
        issueCount: Math.floor(Math.random() * 10) + 1,
        avgSeverity: Math.random() * 5 + 5, // 5 to 10
        categories: [["Power", "Water", "Wi-Fi"][Math.floor(Math.random() * 3)]],
      });
    }
    return points;
  };

  const handleGenerateAIInsight = async () => {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("ciis_token") : null;
      const userStr = typeof window !== "undefined" ? window.localStorage.getItem("ciis_user") : null;

      if (!token) {
        toast.error("Please log in to generate AI insights");
        router.push("/login");
        return;
      }

      let user;
      try {
        user = JSON.parse(userStr || "{}");
      } catch {
        toast.error("Invalid user data");
        return;
      }

      toast.loading("Analyzing heatmap clusters with AI...", { id: "ai-insight" });

      const response = await fetch(`${API_BASE_URL}/api/ai/analyze-heatmap`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: user.organizationId || "ggv-bilaspur",
          heatmapData: heatmapData,
        }),
      });

      if (!response.ok) {
        throw new Error("AI analysis failed");
      }

      const result = await response.json();

      toast.success(
        result.insight || "AI analysis complete! Check the console for details.",
        { id: "ai-insight" }
      );

      // You could show the insight in a modal or sidebar
      console.log("AI Insight:", result);
    } catch (err) {
      console.error("AI Insight error:", err);
      toast.error("Failed to generate AI insight. Please try again.", { id: "ai-insight" });
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#050814]">
        <FloatingNav />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
            <p className="text-white/60">Loading heatmap data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050814] overflow-hidden">
      <FloatingNav />
      
      {/* Main heatmap container */}
      <div className="h-screen pt-16">
        <DynamicHeatmapContainer
          initialData={heatmapData}
          center={campusCenter}
          zoom={15}
          bounds={campusBounds}
          onGenerateAIInsight={handleGenerateAIInsight}
        />
      </div>

      {/* Error message (if any) */}
      {error && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1001] px-4 py-3 bg-rose-950/90 backdrop-blur-xl border border-rose-500/30 rounded-xl shadow-lg">
          <p className="text-sm text-rose-200">
            {error} - Showing placeholder data
          </p>
        </div>
      )}
    </div>
  );
}

