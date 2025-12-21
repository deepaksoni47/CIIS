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
  const [filters, setFilters] = useState<{
    categories: string[];
    timeRange: "24h" | "7d" | "30d";
  }>({
    categories: [], // Empty means all categories
    timeRange: "7d",
  });

  // Default campus bounds (GGV Bilaspur, India - adjust to your campus)
  const campusCenter: [number, number] = [22.0754, 82.1564]; // Bilaspur, Chhattisgarh
  const campusBounds: [[number, number], [number, number]] = [
    [22.065, 82.146], // Southwest
    [22.085, 82.166], // Northeast
  ];

  useEffect(() => {
    fetchHeatmapData();
  }, [filters]);

  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token
      const token = typeof window !== "undefined" ? window.localStorage.getItem("ciis_token") : null;
      const userStr = typeof window !== "undefined" ? window.localStorage.getItem("ciis_user") : null;

      if (!token || !userStr) {
        // Not authenticated - redirect to login
        toast.error("Please log in to view heatmap data");
        router.push("/login");
        setIsLoading(false);
        return;
      }

      let user;
      try {
        user = JSON.parse(userStr);
      } catch {
        toast.error("Invalid user data. Please log in again.");
        router.push("/login");
        setIsLoading(false);
        return;
      }

      // Calculate date range based on timeRange filter
      const now = new Date();
      const endDate = now.toISOString();
      let startDate: Date;
      
      switch (filters.timeRange) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        organizationId: user.organizationId || "ggv-bilaspur",
        startDate: startDate.toISOString(),
        endDate: endDate,
        normalizeWeights: "true",
        timeDecayFactor: "0.5",
        severityWeightMultiplier: "2.0",
      });

      // Add categories if specified
      if (filters.categories.length > 0) {
        filters.categories.forEach((cat) => {
          queryParams.append("categories", cat);
        });
      }

      // Fetch from backend API
      const response = await fetch(
        `${API_BASE_URL}/api/heatmap/data?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Handle response
      const result = await response.json();

      if (!response.ok) {
        // Backend returned an error
        const errorMessage = result.details || result.message || result.error || "Failed to fetch heatmap data";
        throw new Error(errorMessage);
      }

      // Check if response is successful
      if (result.success && result.data) {
        // Handle GeoJSON format
        if (result.data.features && Array.isArray(result.data.features)) {
          // Convert GeoJSON features to heatmap points
          const points: HeatmapPoint[] = result.data.features.map((feature: any) => {
            // GeoJSON uses [longitude, latitude] format
            const coordinates = feature.geometry?.coordinates || [];
            if (coordinates.length < 2) {
              return null;
            }

            return {
              lat: coordinates[1], // Latitude
              lng: coordinates[0], // Longitude
              intensity: feature.properties?.weight || feature.properties?.intensity || 0,
              issueCount: feature.properties?.issueCount || 0,
              avgSeverity: feature.properties?.avgSeverity || 0,
              categories: feature.properties?.categories || [],
            };
          }).filter((point: HeatmapPoint | null): point is HeatmapPoint => point !== null);

          setHeatmapData(points);
          
          if (points.length === 0) {
            setError("No heatmap data found for the selected filters. Try adjusting the time range or categories.");
          }
        } else {
          // Empty data
          setHeatmapData([]);
          setError("No heatmap data available. There may be no issues in the selected time range.");
        }
      } else {
        // Invalid response structure
        setHeatmapData([]);
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load heatmap data";
      setError(errorMessage);
      setHeatmapData([]); // Clear data on error
      
      // Show user-friendly error
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
      } else {
        toast.error(`Failed to load heatmap: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: {
    categories: string[];
    timeRange: "24h" | "7d" | "30d";
  }) => {
    setFilters(newFilters);
    // fetchHeatmapData will be called automatically via useEffect
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

      // Analyze heatmap data and create a prompt
      const criticalZones = heatmapData
        .filter((p) => p.intensity > 0.7)
        .slice(0, 10)
        .map((p) => ({
          location: `Lat: ${p.lat.toFixed(4)}, Lng: ${p.lng.toFixed(4)}`,
          intensity: (p.intensity * 100).toFixed(0) + "%",
          issueCount: p.issueCount || 0,
          categories: p.categories?.join(", ") || "Unknown",
        }));

      const totalIssues = heatmapData.reduce((sum, p) => sum + (p.issueCount || 0), 0);
      const avgSeverity =
        heatmapData.reduce((sum, p) => sum + (p.avgSeverity || 0), 0) / heatmapData.length || 0;

      const analysisPrompt = `Analyze this campus infrastructure heatmap data:

- Total heatmap points: ${heatmapData.length}
- Total issues represented: ${totalIssues}
- Average severity: ${avgSeverity.toFixed(1)}/10
- Time range: ${filters.timeRange}
- Active categories: ${filters.categories.length > 0 ? filters.categories.join(", ") : "All categories"}

Top critical zones (intensity > 70%):
${criticalZones.map((z, i) => `${i + 1}. ${z.location} - ${z.intensity} intensity, ${z.issueCount} issues (${z.categories})`).join("\n")}

Provide:
1. Key patterns and clusters identified
2. Most critical areas requiring immediate attention
3. Recommendations for prioritized maintenance
4. Any correlations between issue types and locations

Keep the response concise and actionable.`;

      // Use the AI chat endpoint
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: analysisPrompt,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.details || result.message || result.error || "AI analysis failed";
        throw new Error(errorMessage);
      }

      if (result.success && result.data?.aiResponse) {
        toast.success("AI analysis complete! Check the console for details.", {
          id: "ai-insight",
          duration: 5000,
        });

        // Log the full insight
        console.log("=== AI Heatmap Analysis ===");
        console.log(result.data.aiResponse);
        console.log("===========================");

        // You could show this in a modal or expandable panel
        // For now, we'll just log it and show a success message
      } else {
        throw new Error("Invalid response from AI service");
      }
    } catch (err) {
      console.error("AI Insight error:", err);
      toast.error(
        err instanceof Error
          ? `Failed to generate AI insight: ${err.message}`
          : "Failed to generate AI insight. Please try again.",
        { id: "ai-insight" }
      );
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
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Error message (if any) */}
      {error && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1001] px-6 py-4 bg-rose-950/90 backdrop-blur-xl border border-rose-500/30 rounded-xl shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-rose-200 mb-1">Unable to load heatmap</p>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-rose-400 hover:text-rose-200 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Empty state when no data */}
      {!isLoading && !error && heatmapData.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md text-center pointer-events-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Heatmap Data</h3>
            <p className="text-sm text-white/60 mb-4">
              No infrastructure issues found for the selected time range and filters.
            </p>
            <p className="text-xs text-white/40">
              Try adjusting the time range or category filters to see data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

