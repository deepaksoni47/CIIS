"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeatmapSidebarProps {
  layers: {
    water: boolean;
    power: boolean;
    wifi: boolean;
  };
  timeRange: "24h" | "7d" | "30d";
  onLayerToggle: (layer: "water" | "power" | "wifi") => void;
  onTimeRangeChange: (range: "24h" | "7d" | "30d") => void;
  onClose: () => void;
}

export function HeatmapSidebar({
  layers,
  timeRange,
  onLayerToggle,
  onTimeRangeChange,
  onClose,
}: HeatmapSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -400 }}
          animate={{ x: 0 }}
          exit={{ x: -400 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed left-4 top-20 z-[1000] w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
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

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Layer Toggles */}
            <div>
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Infrastructure Layers
              </h3>
              <div className="space-y-2">
                {[
                  { key: "water" as const, label: "Water Systems", icon: "💧" },
                  { key: "power" as const, label: "Power & Electrical", icon: "⚡" },
                  { key: "wifi" as const, label: "Wi-Fi & Network", icon: "📶" },
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

            {/* Time Range Slider */}
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
                    onClick={() => onTimeRangeChange(option.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      timeRange === option.value
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toggle Button (when closed) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={toggleSidebar}
          className="fixed left-4 top-20 z-[1000] p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg hover:bg-black/90 transition-colors"
          aria-label="Open sidebar"
        >
          <svg
            className="w-6 h-6 text-white"
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
      )}
    </AnimatePresence>
  );
}

