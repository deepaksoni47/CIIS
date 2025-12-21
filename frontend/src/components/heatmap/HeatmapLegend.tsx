"use client";

import { motion } from "framer-motion";

export function HeatmapLegend() {
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
      className="fixed bottom-6 right-6 z-[1000] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 w-64"
    >
      <h3 className="text-sm font-semibold text-white mb-3">Heat Intensity</h3>
      <div className="space-y-2">
        {gradientStops.map((stop, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg border border-white/20 flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${stop.color}, ${stop.color})`,
              }}
            />
            <div className="flex-1">
              <div className="text-xs font-medium text-white">{stop.label}</div>
              <div className="text-xs text-white/60">{stop.intensity}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-white/60 leading-relaxed">
          Intensity is calculated from issue severity, priority, and recency.
          Red zones indicate critical infrastructure problems requiring immediate
          attention.
        </p>
      </div>
    </motion.div>
  );
}

