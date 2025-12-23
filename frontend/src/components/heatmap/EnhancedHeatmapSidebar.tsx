"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert,Wrench,University,Building,Droplet,Zap,Wifi,Search,Settings } from "lucide-react";

export type PresetMode =
  | "emergency"
  | "maintenance"
  | "overview"
  | "building"
  | "custom";

export interface HeatmapConfig {
  timeDecayFactor: number;
  severityWeightMultiplier: number;
  gridSize: number;
  clusterRadius?: number;
  minClusterSize?: number;
  normalizeWeights: boolean;
}

export interface HeatmapFilters {
  categories: string[];
  priorities: string[];
  statuses: string[];
  timeRange: "24h" | "7d" | "30d" | "custom";
  minSeverity: number;
  maxAge?: number;
  startDate?: string;
  endDate?: string;
}

interface EnhancedHeatmapSidebarProps {
  layers: {
    water: boolean;
    power: boolean;
    wifi: boolean;
  };
  config: HeatmapConfig;
  filters: HeatmapFilters;
  endpointMode: "data" | "clustered" | "grid";
  onLayerToggle: (layer: "water" | "power" | "wifi") => void;
  onConfigChange: (config: Partial<HeatmapConfig>) => void;
  onFiltersChange: (filters: Partial<HeatmapFilters>) => void;
  onPresetSelect: (preset: PresetMode) => void;
  onEndpointModeChange: (mode: "data" | "clustered" | "grid") => void;
  onClose: () => void;
}

export function EnhancedHeatmapSidebar({
  layers,
  config,
  filters,
  endpointMode,
  onLayerToggle,
  onConfigChange,
  onFiltersChange,
  onPresetSelect,
  onEndpointModeChange,
  onClose,
}: EnhancedHeatmapSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"filters" | "config" | "presets">(
    "presets"
  );
  const [isIntensityOpen, setIsIntensityOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const presets = [
    {
      id: "emergency" as PresetMode,
      name: "Emergency Response",
      icon: <ShieldAlert />,
      description: "Critical issues, fast decay",
      color: "from-red-600 to-rose-600",
    },
    {
      id: "maintenance" as PresetMode,
      name: "Maintenance Planning",
      icon: <Wrench />,
      description: "Persistent problems, slow decay",
      color: "from-blue-600 to-cyan-600",
    },
    {
      id: "overview" as PresetMode,
      name: "Campus Overview",
      icon: <University />,
      description: "Large-scale view, optimized",
      color: "from-violet-600 to-purple-600",
    },
    {
      id: "building" as PresetMode,
      name: "Building Analysis",
      icon: <Building />,
      description: "High detail, building focus",
      color: "from-green-600 to-emerald-600",
    },
  ];

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={toggleSidebar}
        className="fixed left-2 md:left-4 top-16 md:top-20 z-[1000] p-2 md:p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg md:rounded-xl shadow-lg hover:bg-black/90 transition-colors"
        aria-label="Open sidebar"
      >
        <svg
          className="w-5 h-5 md:w-6 md:h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: -450 }}
      animate={{ x: 0 }}
      exit={{ x: -450 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed left-0 md:left-4 top-14 md:top-20 bottom-0 md:bottom-auto z-[1000] w-full md:w-[420px] md:max-h-[calc(100vh-112px)] bg-black/90 backdrop-blur-xl border-0 md:border border-white/10 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Heatmap Controls</h2>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-5 h-5 text-white/70"
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

      {/* Tabs */}
      <div className="flex border-b border-white/10 flex-shrink-0 flex-row justify-center">
  {[
    { id: "presets", label: "Presets", icon: <Zap /> },
    { id: "filters", label: "Filters", icon: <Search /> },
    { id: "config", label: "Config", icon: <Settings /> },
  ].map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id as any)}
      // Added: flex, items-center, justify-center
      className={`flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center ${
        activeTab === tab.id
          ? "text-white bg-white/10 border-b-2 border-violet-500"
          : "text-white/60 hover:text-white/80 hover:bg-white/5"
      }`}
    >
      <span className="mr-2 flex items-center">{tab.icon}</span>
      {tab.label}
    </button>
  ))}
</div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Presets Tab */}
        {activeTab === "presets" && (
          <div className="space-y-3">
            <p className="text-xs text-white/60 mb-4">
              Quick-select optimized configurations for common use cases
            </p>
            {presets.map((preset) => (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPresetSelect(preset.id)}
                className={`w-full p-4 rounded-xl bg-gradient-to-r ${preset.color} text-white shadow-lg hover:shadow-xl transition-all text-left`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{preset.icon}</span>
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-white/80">
                      {preset.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Filters Tab */}
        {activeTab === "filters" && (
          <div className="space-y-6">
            {/* Layer Toggles */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Infrastructure Layers
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: "water" as const,
                    label: "Water Systems",
                    icon: <Droplet />,
                  },
                  {
                    key: "power" as const,
                    label: "Power & Electrical",
                    icon: <Zap />,
                  },
                  {
                    key: "wifi" as const,
                    label: "Wi-Fi & Network",
                    icon: <Wifi />,
                  },
                ].map((layer) => (
                  <label
                    key={layer.key}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={layers[layer.key]}
                      onChange={() => onLayerToggle(layer.key)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
                    />
                    <span className="text-2xl">{layer.icon}</span>
                    <span className="text-sm text-white/90 flex-1">
                      {layer.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Priority Levels
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {["critical", "high", "medium", "low"].map((priority) => (
                  <label
                    key={priority}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={(e) => {
                        const newPriorities = e.target.checked
                          ? [...filters.priorities, priority]
                          : filters.priorities.filter((p) => p !== priority);
                        onFiltersChange({ priorities: newPriorities });
                      }}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-violet-500"
                    />
                    <span className="text-xs text-white/90">
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Issue Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {["open", "in_progress", "resolved", "closed"].map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={(e) => {
                        const newStatuses = e.target.checked
                          ? [...filters.statuses, status]
                          : filters.statuses.filter((s) => s !== status);
                        onFiltersChange({ statuses: newStatuses });
                      }}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-violet-500"
                    />
                    <span className="text-xs text-white/90">
                      {status
                        .replace("_", " ")
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Time Range
              </h3>
              <div className="space-y-2">
                {[
                  { value: "24h" as const, label: "Last 24 Hours" },
                  { value: "7d" as const, label: "Last 7 Days" },
                  { value: "30d" as const, label: "Last 30 Days" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onFiltersChange({ timeRange: option.value })}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      filters.timeRange === option.value
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min Severity Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-white/80">
                  Min Severity
                </h3>
                <span className="text-sm font-semibold text-violet-400">
                  {filters.minSeverity}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={filters.minSeverity}
                onChange={(e) =>
                  onFiltersChange({ minSeverity: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>Critical</span>
              </div>
            </div>

            {/* Max Age Input */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-2">
                Max Age (days)
              </h3>
              <input
                type="number"
                min="1"
                max="365"
                value={filters.maxAge || ""}
                onChange={(e) =>
                  onFiltersChange({
                    maxAge: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="All ages"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="space-y-6">
            {/* Endpoint Mode Selection */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                API Endpoint
              </h3>
              <div className="space-y-2">
                {[
                  {
                    value: "data" as const,
                    label: "Standard",
                    description: "Full feature set",
                  },
                  {
                    value: "clustered" as const,
                    label: "Clustered",
                    description: "Auto-clustering",
                  },
                  {
                    value: "grid" as const,
                    label: "Grid",
                    description: "Grid aggregation",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onEndpointModeChange(option.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-left transition-all ${
                      endpointMode === option.value
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-80">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-2">
                {endpointMode === "data" &&
                  "Uses /api/heatmap/data with all features"}
                {endpointMode === "clustered" &&
                  "Uses /api/heatmap/clustered for auto-clustering"}
                {endpointMode === "grid" &&
                  "Uses /api/heatmap/grid for optimized performance"}
              </p>
            </div>

            {/* Heat Intensity Section - Collapsible */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsIntensityOpen(!isIntensityOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <h3 className="text-sm font-medium text-white/90">
                    Heat Intensity Controls
                  </h3>
                </div>
                <svg
                  className={`w-5 h-5 text-white/70 transition-transform duration-200 ${
                    isIntensityOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isIntensityOpen && (
                <div className="p-4 space-y-6 bg-black/20">
                  {/* Time Decay Factor */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-white/80">
                        Time Decay Factor
                      </h3>
                      <span className="text-sm font-semibold text-violet-400">
                        {config.timeDecayFactor.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.timeDecayFactor}
                      onChange={(e) =>
                        onConfigChange({
                          timeDecayFactor: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>No Decay (0)</span>
                      <span>Moderate (1)</span>
                      <span>Fast (2)</span>
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      Controls how recent issues are weighted. Higher = only
                      recent issues visible.
                    </p>
                  </div>

                  {/* Severity Weight Multiplier */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-white/80">
                        Severity Weight
                      </h3>
                      <span className="text-sm font-semibold text-violet-400">
                        {config.severityWeightMultiplier.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={config.severityWeightMultiplier}
                      onChange={(e) =>
                        onConfigChange({
                          severityWeightMultiplier: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>Subtle (0.5)</span>
                      <span>Default (2)</span>
                      <span>Heavy (5)</span>
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      Amplifies critical issue visibility. Higher = severe
                      issues dominate.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Grid Size */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Grid Size (meters)
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map((size) => (
                  <button
                    key={size}
                    onClick={() => onConfigChange({ gridSize: size })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      config.gridSize === size
                        ? "bg-violet-600 text-white shadow-lg"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {size}m
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-2">
                Spatial aggregation density. Lower = more detail, higher =
                overview.
              </p>
            </div>

            {/* Cluster Radius */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-white/80">
                  Cluster Radius (m)
                </h3>
                <span className="text-sm font-semibold text-violet-400">
                  {config.clusterRadius || "Off"}
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="500"
                step="50"
                value={config.clusterRadius || ""}
                onChange={(e) =>
                  onConfigChange({
                    clusterRadius: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="Disabled"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-white/50 mt-2">
                Clustering distance for large datasets. Leave empty to disable.
              </p>
            </div>

            {/* Min Cluster Size */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-2">
                Min Cluster Size
              </h3>
              <input
                type="number"
                min="2"
                max="10"
                value={config.minClusterSize || 2}
                onChange={(e) =>
                  onConfigChange({
                    minClusterSize: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-white/50 mt-2">
                Minimum issues required to form a cluster.
              </p>
            </div>

            {/* Normalize Weights */}
            <div>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.normalizeWeights}
                  onChange={(e) =>
                    onConfigChange({ normalizeWeights: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
                />
                <div>
                  <h3 className="text-sm font-medium text-white/90">
                    Normalize Weights
                  </h3>
                  <p className="text-xs text-white/50">
                    Scale weights to 0-1 range
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
