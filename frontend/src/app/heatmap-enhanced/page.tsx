"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  EnhancedHeatmapSidebar,
  type HeatmapConfig,
  type HeatmapFilters,
  type PresetMode,
} from "@/components/heatmap/EnhancedHeatmapSidebar";
import { HeatmapStats } from "@/components/heatmap/HeatmapStats";
import {
  COLLEGE_OPTIONS,
  DEFAULT_COLLEGE_ID,
  createBoundsFromCollege,
  getCollegeByOrganizationId,
} from "@/data/colleges";

// Dynamic import to avoid SSR issues with Leaflet
const DynamicHeatmapContainer = dynamic(
  () =>
    import("@/components/heatmap/HeatmapContainer").then(
      (mod) => mod.HeatmapContainer,
    ),
  { ssr: false },
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  issueCount?: number;
  avgSeverity?: number;
  categories?: string[];
  issueIds?: string[];
}

interface HeatmapStatsData {
  totalPoints: number;
  totalIssues: number;
  avgWeight: number;
  maxWeight: number;
  minWeight: number;
  weightDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  geographicBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  categoryBreakdown: Record<string, number>;
  timeDecayStats: {
    avgAge: number;
    oldestIssue: string;
    newestIssue: string;
  };
}

// Preset configurations
const PRESETS: Record<
  PresetMode,
  { config: Partial<HeatmapConfig>; filters: Partial<HeatmapFilters> }
> = {
  emergency: {
    config: {
      timeDecayFactor: 1.0,
      severityWeightMultiplier: 3.0,
      gridSize: 25,
      normalizeWeights: true,
    },
    filters: {
      priorities: ["critical", "high"],
      statuses: ["open", "in_progress"],
      timeRange: "7d",
      minSeverity: 5,
    },
  },
  maintenance: {
    config: {
      timeDecayFactor: 0.3,
      severityWeightMultiplier: 1.5,
      gridSize: 50,
      clusterRadius: 100,
      minClusterSize: 3,
      normalizeWeights: true,
    },
    filters: {
      timeRange: "30d",
      statuses: ["open", "in_progress"], // Changed from ["open", "resolved"] since no resolved issues exist
      minSeverity: 1,
    },
  },
  overview: {
    config: {
      timeDecayFactor: 0.5,
      severityWeightMultiplier: 2.0,
      gridSize: 100,
      clusterRadius: 200,
      minClusterSize: 5,
      normalizeWeights: true,
    },
    filters: {
      timeRange: "30d",
      minSeverity: 1,
      // No status filter - show all statuses
    },
  },
  building: {
    config: {
      timeDecayFactor: 0.5,
      severityWeightMultiplier: 2.0,
      gridSize: 25,
      normalizeWeights: true,
    },
    filters: {
      timeRange: "7d",
      minSeverity: 1,
      // No status filter - show all statuses
    },
  },
  custom: {
    config: {},
    filters: {},
  },
};

export default function HeatmapPage() {
  const { getToken, refreshToken, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [statsData, setStatsData] = useState<HeatmapStatsData | undefined>(
    undefined,
  );
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [endpointMode, setEndpointMode] = useState<
    "data" | "clustered" | "grid"
  >("data");

  // AI Insights state
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // UI layer state
  const [layers, setLayers] = useState({
    water: true,
    power: true,
    wifi: true,
  });

  // Configuration state
  const [config, setConfig] = useState<HeatmapConfig>({
    timeDecayFactor: 0.5,
    severityWeightMultiplier: 2.0,
    gridSize: 100,
    clusterRadius: 200,
    minClusterSize: 5,
    normalizeWeights: true,
  });

  // Filters state - Default to "overview" preset settings
  const [filters, setFilters] = useState<HeatmapFilters>({
    categories: [],
    priorities: [],
    statuses: [],
    timeRange: "30d",
    minSeverity: 1,
  });
  const defaultCollege =
    getCollegeByOrganizationId(DEFAULT_COLLEGE_ID) || COLLEGE_OPTIONS[0];
  const [activeOrganizationId, setActiveOrganizationId] = useState<string>(
    defaultCollege.organizationId,
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    defaultCollege.lat,
    defaultCollege.lng,
  ]);
  const [mapBounds, setMapBounds] = useState<
    [[number, number], [number, number]]
  >(createBoundsFromCollege(defaultCollege));

  // Map UI layer names to backend category names
  const layerCategoryMap: Record<string, string[]> = {
    water: [
      "Water",
      "Plumbing",
      "Drainage",
      "Water Supply",
      "WATER",
      "PLUMBING",
    ],
    power: [
      "Power",
      "Electrical",
      "Electricity",
      "Power Supply",
      "POWER",
      "ELECTRICAL",
      "ELECTRICITY",
    ],
    wifi: [
      "Wi-Fi",
      "Network",
      "Internet",
      "Connectivity",
      "WiFi",
      "WIFI",
      "NETWORK",
    ],
  };

  // Build categories array from active layers
  const getActiveCategories = useCallback(() => {
    const categories: string[] = [];
    if (layers.water) categories.push(...layerCategoryMap.water);
    if (layers.power) categories.push(...layerCategoryMap.power);
    if (layers.wifi) categories.push(...layerCategoryMap.wifi);
    return categories;
  }, [layers]);

  // Convert time range to maxAge in days
  const getMaxAge = (
    timeRange: string,
    customMaxAge?: number,
  ): number | undefined => {
    if (customMaxAge) return customMaxAge;
    switch (timeRange) {
      case "24h":
        return 1;
      case "7d":
        return 7;
      case "30d":
        return 30;
      default:
        return undefined;
    }
  };

  const resolveOrganizationContext = useCallback(() => {
    const userDataStr = localStorage.getItem("campuscare_user");
    if (!userDataStr) {
      throw new Error("No user data found. Please log in again.");
    }

    const userData = JSON.parse(userDataStr);
    const organizationId = userData.organizationId || DEFAULT_COLLEGE_ID;
    const college =
      getCollegeByOrganizationId(organizationId) || defaultCollege;

    return { organizationId, college } as const;
  }, [defaultCollege]);

  // Fetch heatmap data
  const fetchHeatmapData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Refresh token before making API call
      await refreshToken();

      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const { organizationId, college } = resolveOrganizationContext();
      setActiveOrganizationId(organizationId);
      setMapCenter([college.lat, college.lng]);
      setMapBounds(createBoundsFromCollege(college));

      // Build query parameters
      const params = new URLSearchParams({
        organizationId,
        timeDecayFactor: config.timeDecayFactor.toString(),
        severityWeightMultiplier: config.severityWeightMultiplier.toString(),
        gridSize: config.gridSize.toString(),
        normalizeWeights: config.normalizeWeights.toString(),
      });

      // Add optional config parameters
      if (config.clusterRadius) {
        params.append("clusterRadius", config.clusterRadius.toString());
      }
      if (config.minClusterSize) {
        params.append("minClusterSize", config.minClusterSize.toString());
      }

      // Add filter parameters
      const activeCategories = getActiveCategories();
      if (activeCategories.length > 0) {
        params.append("categories", activeCategories.join(","));
      }
      // Only add priority/status filters if user has selected specific ones
      if (filters.priorities.length > 0) {
        params.append("priorities", filters.priorities.join(","));
      }
      if (filters.statuses.length > 0) {
        params.append("statuses", filters.statuses.join(","));
      }

      // Determine endpoint based on mode
      let endpoint = "data";
      if (endpointMode === "clustered") {
        endpoint = "clustered";
      } else if (endpointMode === "grid") {
        endpoint = "grid";
      }

      // Debug: Log the request URL
      console.log(
        "Fetching heatmap from:",
        `${API_BASE_URL}/api/heatmap/${endpoint}?${params.toString()}`,
      );

      if (filters.minSeverity > 1) {
        params.append("minSeverity", filters.minSeverity.toString());
      }

      const maxAge = getMaxAge(filters.timeRange, filters.maxAge);
      if (maxAge) {
        params.append("maxAge", maxAge.toString());
      }

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/heatmap/${endpoint}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const result = await response.json();

      if (!response.ok) {
        console.error("API Error:", result);
        throw new Error(result.message || "Failed to fetch heatmap data");
      }

      // Debug: Log the response
      console.log("Heatmap API Response:", {
        success: result.success,
        featureCount: result.data?.features?.length || 0,
        metadata: result.data?.metadata,
      });

      if (result.success && result.data?.type === "FeatureCollection") {
        const features = result.data.features || [];

        // Convert GeoJSON features to HeatmapPoint format
        const points: HeatmapPoint[] = features
          .filter((feature: any) => {
            const coords = feature.geometry?.coordinates;
            const props = feature.properties;
            return (
              coords &&
              coords.length === 2 &&
              typeof coords[0] === "number" &&
              typeof coords[1] === "number" &&
              props?.weight !== undefined
            );
          })
          .map((feature: any) => {
            const [lng, lat] = feature.geometry.coordinates;
            const props = feature.properties;
            return {
              lat,
              lng,
              intensity: props.weight || 0,
              issueCount: props.issueCount,
              avgSeverity: props.avgSeverity,
              categories: props.categories || [],
              issueIds: props.issueIds || [],
            };
          });

        console.log("Converted heatmap points:", points.length, "points");
        if (points.length > 0) {
          console.log("Sample point:", points[0]);
        } else {
          console.warn(
            "No heatmap points after conversion. Check filters and data location.",
          );
        }

        setHeatmapData(points);
      } else {
        console.error("Invalid response format:", result);
        throw new Error("Invalid heatmap data format received");
      }
    } catch (err) {
      console.error("Heatmap fetch error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load heatmap data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    config,
    filters,
    layers,
    getActiveCategories,
    endpointMode,
    getToken,
    refreshToken,
    resolveOrganizationContext,
  ]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);

      // Refresh token before making API call
      await refreshToken();

      const token = getToken();
      if (!token) return;

      const { organizationId } = resolveOrganizationContext();

      // Build same query parameters as data fetch
      const params = new URLSearchParams({
        organizationId,
        timeDecayFactor: config.timeDecayFactor.toString(),
        severityWeightMultiplier: config.severityWeightMultiplier.toString(),
        gridSize: config.gridSize.toString(),
      });

      const activeCategories = getActiveCategories();
      if (activeCategories.length > 0) {
        params.append("categories", activeCategories.join(","));
      }
      if (filters.priorities.length > 0) {
        params.append("priorities", filters.priorities.join(","));
      }
      if (filters.statuses.length > 0) {
        params.append("statuses", filters.statuses.join(","));
      }

      const maxAge = getMaxAge(filters.timeRange, filters.maxAge);
      if (maxAge) {
        params.append("maxAge", maxAge.toString());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/heatmap/stats?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const result = await response.json();
      if (result.success && result.data) {
        setStatsData(result.data);
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [
    config,
    filters,
    layers,
    getActiveCategories,
    getToken,
    refreshToken,
    resolveOrganizationContext,
  ]);

  // Initial fetch
  useEffect(() => {
    fetchHeatmapData();
    fetchStats();
  }, [fetchHeatmapData, fetchStats]);

  // Handle layer toggle
  const handleLayerToggle = (layer: "water" | "power" | "wifi") => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  // Handle config change
  const handleConfigChange = (newConfig: Partial<HeatmapConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: Partial<HeatmapFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Handle preset selection
  const handlePresetSelect = (preset: PresetMode) => {
    const presetData = PRESETS[preset];
    setConfig((prev) => ({ ...prev, ...presetData.config }));
    setFilters((prev) => ({ ...prev, ...presetData.filters }));
    toast.success(`Applied ${preset} preset configuration`);
  };

  // Generate AI insight
  const handleGenerateAIInsight = async () => {
    try {
      toast.loading("Analyzing heatmap data...", { id: "ai-insight" });

      // Refresh token before making API call
      await refreshToken();

      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Find critical zones (intensity > 0.7)
      const criticalZones = heatmapData
        .filter((point) => point.intensity > 0.7)
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 5)
        .map((point) => ({
          location: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
          intensity: `${(point.intensity * 100).toFixed(0)}%`,
          issueCount: point.issueCount || 0,
          categories: point.categories?.join(", ") || "Unknown",
        }));

      if (criticalZones.length === 0) {
        toast.success(
          "No critical zones detected. Campus infrastructure is in good condition!",
          {
            id: "ai-insight",
            duration: 5000,
          },
        );
        return;
      }

      const analysisPrompt = `Analyze this campus infrastructure heatmap data:

Total heatmap points: ${heatmapData.length}
Critical zones identified: ${criticalZones.length}

Top critical zones (intensity > 70%):
${criticalZones.map((z, i) => `${i + 1}. ${z.location} - ${z.intensity} intensity, ${z.issueCount} issues (${z.categories})`).join("\n")}

Provide:
1. Key patterns and clusters identified
2. Most critical areas requiring immediate attention
3. Recommendations for prioritized maintenance
4. Any correlations between issue types and locations

Keep the response concise and actionable.`;

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
        const errorMessage =
          result.details ||
          result.message ||
          result.error ||
          "AI analysis failed";
        throw new Error(errorMessage);
      }

      if (result.success && result.data?.aiResponse) {
        setAiInsight(result.data.aiResponse);
        setShowAiModal(true);

        toast.success("AI analysis complete!", {
          id: "ai-insight",
          duration: 3000,
        });

        console.log("=== AI Heatmap Analysis ===");
        console.log(result.data.aiResponse);
        console.log("===========================");
      } else {
        throw new Error("Invalid response from AI service");
      }
    } catch (err) {
      console.error("AI Insight error:", err);
      toast.error(
        err instanceof Error
          ? `Failed to generate AI insight: ${err.message}`
          : "Failed to generate AI insight. Please try again.",
        { id: "ai-insight" },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#050814]">
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
      {/* Main heatmap container */}
      <div className="h-screen pt-0 md:pt-0">
        <DynamicHeatmapContainer
          initialData={heatmapData}
          center={mapCenter}
          zoom={15}
          bounds={mapBounds}
          onGenerateAIInsight={handleGenerateAIInsight}
          onFiltersChange={() => {}}
        />
      </div>

      {/* Enhanced Sidebar */}
      <EnhancedHeatmapSidebar
        layers={layers}
        config={config}
        filters={filters}
        endpointMode={endpointMode}
        onLayerToggle={handleLayerToggle}
        onConfigChange={handleConfigChange}
        onFiltersChange={handleFiltersChange}
        onPresetSelect={handlePresetSelect}
        onEndpointModeChange={setEndpointMode}
        onClose={() => {}}
      />

      {/* Statistics Panel */}
      <HeatmapStats
        statsData={statsData}
        isLoading={isLoadingStats}
        onRefresh={fetchStats}
      />

      {/* AI Insights Modal */}
      {showAiModal && aiInsight && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] md:max-h-[80vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl md:rounded-2xl shadow-2xl border border-violet-500/20 overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-bold text-white">
                    AI Infrastructure Analysis
                  </h2>
                  <p className="text-xs md:text-sm text-white/70 hidden sm:block">
                    Generated insights from campus data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-3 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)] md:max-h-[calc(80vh-80px)]">
              <div className="prose prose-invert prose-violet max-w-none">
                <div className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {aiInsight.split("\n").map((line, idx) => {
                    // Bold headers (lines starting with **)
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <h3
                          key={idx}
                          className="text-lg font-bold text-violet-400 mt-4 mb-2"
                        >
                          {line.replace(/\*\*/g, "")}
                        </h3>
                      );
                    }
                    // Emoji lines (priority alerts, etc)
                    if (line.match(/^[🚨💧⚡🌡️]/)) {
                      return (
                        <div
                          key={idx}
                          className="bg-violet-500/10 border-l-4 border-violet-500 p-3 my-2 rounded-r"
                        >
                          <p className="text-white font-medium">{line}</p>
                        </div>
                      );
                    }
                    // Numbered lists
                    if (line.match(/^\d+\./)) {
                      return (
                        <p key={idx} className="ml-4 my-1 text-white/80">
                          {line}
                        </p>
                      );
                    }
                    // Regular text
                    if (line.trim()) {
                      return (
                        <p key={idx} className="my-2 text-white/80">
                          {line}
                        </p>
                      );
                    }
                    return <br key={idx} />;
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur px-3 md:px-6 py-3 md:py-4 border-t border-white/10 flex justify-end gap-2 md:gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiInsight);
                  toast.success("Copied to clipboard!");
                }}
                className="px-3 md:px-4 py-2 text-sm md:text-base rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3 md:px-4 py-2 text-sm md:text-base rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="fixed bottom-4 md:bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-[1001] px-4 md:px-6 py-3 md:py-4 bg-rose-950/90 backdrop-blur-xl border border-rose-500/30 rounded-xl shadow-lg max-w-md mx-auto">
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
              <p className="text-sm font-medium text-rose-200 mb-1">
                Unable to load heatmap
              </p>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-rose-400 hover:text-rose-200 transition-colors"
              aria-label="Dismiss error"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && heatmapData.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] pointer-events-none px-4">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-6 md:p-8 max-w-md text-center pointer-events-auto">
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
            <h3 className="text-lg font-semibold text-white mb-2">
              No Heatmap Data
            </h3>
            <p className="text-sm text-white/60 mb-4">
              No infrastructure issues found for the selected filters.
            </p>
            <p className="text-xs text-white/40">
              Try adjusting the time range, categories, or severity filters to
              see data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
