"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Issue {
  id: number;
  x: number;
  y: number;
  type: "critical" | "warning" | "info";
  label: string;
}

const mockIssues: Issue[] = [
  { id: 1, x: 20, y: 30, type: "critical", label: "Power Outage" },
  { id: 2, x: 60, y: 45, type: "warning", label: "HVAC Fault" },
  { id: 3, x: 40, y: 65, type: "critical", label: "Water Leakage" },
  { id: 4, x: 75, y: 25, type: "info", label: "Network Issue" },
  { id: 5, x: 35, y: 80, type: "warning", label: "Elevator Issue" },
];

export function InteractiveCampusMap() {
  const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);

  const getIssueColor = (type: Issue["type"]) => {
    switch (type) {
      case "critical":
        return "from-red-500 to-orange-500";
      case "warning":
        return "from-amber-500 to-yellow-500";
      case "info":
        return "from-violet-500 to-purple-600";
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto">
      {/* Main Map Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl shadow-2xl"
      >
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Animated Heatmap Base */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <radialGradient id="heat1" cx="30%" cy="40%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat2" cx="60%" cy="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat3" cx="45%" cy="70%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="30%" cy="40%" r="20%" fill="url(#heat1)" />
          <circle cx="60%" cy="50%" r="15%" fill="url(#heat2)" />
          <circle cx="45%" cy="70%" r="18%" fill="url(#heat3)" />
        </svg>

        {/* Campus Buildings Outline */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Building shapes */}
          <motion.rect
            x="15"
            y="25"
            width="20"
            height="15"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          <motion.rect
            x="55"
            y="40"
            width="25"
            height="18"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.7 }}
          />
          <motion.rect
            x="30"
            y="60"
            width="22"
            height="20"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.9 }}
          />
        </svg>

        {/* Issue Markers */}
        {mockIssues.map((issue, index) => (
          <motion.div
            key={issue.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 1 + index * 0.15,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="absolute"
            style={{
              left: `${issue.x}%`,
              top: `${issue.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseEnter={() => setHoveredIssue(issue.id)}
            onMouseLeave={() => setHoveredIssue(null)}
          >
            {/* Pulsing Ring */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${getIssueColor(issue.type)} blur-md`}
              style={{ width: "40px", height: "40px", margin: "-10px" }}
            />

            {/* Core Marker */}
            <motion.div
              whileHover={{ scale: 1.2 }}
              className={`relative w-5 h-5 rounded-full bg-gradient-to-br ${getIssueColor(issue.type)} shadow-lg cursor-pointer border-2 border-white/30`}
            >
              {/* Inner Glow */}
              <div className="absolute inset-0 rounded-full bg-white/40 blur-sm" />
            </motion.div>

            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: hoveredIssue === issue.id ? 1 : 0,
                y: hoveredIssue === issue.id ? -40 : -30,
              }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
            >
              <div className="px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-white/20 shadow-xl">
                <span className="text-xs font-medium text-white">
                  {issue.label}
                </span>
              </div>
              <div className="w-2 h-2 bg-black/90 rotate-45 mx-auto -mt-1 border-r border-b border-white/20" />
            </motion.div>
          </motion.div>
        ))}

        {/* Scanning Line Effect */}
        <motion.div
          animate={{
            top: ["0%", "100%", "0%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
        />

        {/* Corner Brackets */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-400/50" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-400/50" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-400/50" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-400/50" />

        {/* Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="space-y-1">
            <div className="text-xs text-white/40">
              Guru Ghasidas University
            </div>
            <div className="text-sm font-semibold text-white">
              22.1310°N, 82.1495°E
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
              <span className="text-xs text-white/60">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500" />
              <span className="text-xs text-white/60">Warning</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Stats */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute -right-4 top-1/4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
      >
        <div className="text-xs text-white/40 mb-2">Active Issues</div>
        <div className="text-3xl font-bold text-white mb-1">
          {mockIssues.length}
        </div>
        <div className="flex items-center gap-1 text-xs text-red-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
              clipRule="evenodd"
            />
          </svg>
          <span>2 Critical</span>
        </div>
      </motion.div>
    </div>
  );
}
