"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function HeatmapLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  const gradientStops = [
    { color: "blue", label: "Low", intensity: "0-20%" },
    { color: "cyan", label: "Moderate", intensity: "20-40%" },
    { color: "lime", label: "Medium", intensity: "40-60%" },
    { color: "yellow", label: "High", intensity: "60-80%" },
    { color: "orange", label: "Very High", intensity: "80-90%" },
    { color: "red", label: "Critical", intensity: "90-100%" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[1000] bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl shadow-2xl w-auto md:w-64"
    >
      {/* Mobile: Compact Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden w-full flex items-center justify-between p-3 text-white"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 via-yellow-500 to-red-500" />
          <span className="text-sm font-semibold">Heat Intensity</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
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

      {/* Desktop: Always Visible / Mobile: Collapsible */}
      <div className={`${isExpanded ? "block" : "hidden"} md:block p-4`}>
        <h3 className="text-sm font-semibold text-white mb-3 hidden md:block">
          Heat Intensity
        </h3>
        <div className="space-y-2">
          {gradientStops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2 md:gap-3">
              <div
                className="w-6 h-6 md:w-8 md:h-8 rounded-lg border border-white/20 flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${stop.color}, ${stop.color})`,
                }}
              />
              <div className="flex-1">
                <div className="text-xs font-medium text-white">
                  {stop.label}
                </div>
                <div className="text-xs text-white/60">{stop.intensity}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
          <p className="text-xs text-white/60 leading-relaxed">
            Intensity is calculated from issue severity, priority, and recency.
            Red zones indicate critical infrastructure problems requiring
            immediate attention.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
