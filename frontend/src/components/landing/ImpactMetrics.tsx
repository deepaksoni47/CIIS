"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useRef, useEffect } from "react";

interface MetricCardProps {
  value: number;
  suffix: string;
  label: string;
  description: string;
  delay: number;
  gradient: string;
}

function MetricCard({
  value,
  suffix,
  label,
  description,
  delay,
  gradient,
}: MetricCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        delay: delay,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, count, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, delay }}
      className="group relative"
    >
      {/* Card */}
      <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-white/30">
        {/* Animated Background */}
        <motion.div
          className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${gradient}`}
          initial={false}
        />

        {/* Glow Effect */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${gradient} blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
        />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Icon */}
          <motion.div
            animate={
              isInView
                ? {
                    rotate: [0, 360],
                  }
                : {}
            }
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </motion.div>

          {/* Number */}
          <div className="flex items-baseline gap-2">
            <motion.span className="text-6xl font-bold text-white">
              {rounded}
            </motion.span>
            <span
              className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}
            >
              {suffix}
            </span>
          </div>

          {/* Label */}
          <h3 className="text-xl font-bold text-white">{label}</h3>

          {/* Description */}
          <p className="text-white/50 text-sm leading-relaxed">{description}</p>

          {/* Progress Bar */}
          <motion.div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={isInView ? { width: "100%" } : {}}
              transition={{ duration: 2, delay: delay + 0.5 }}
              className={`h-full bg-gradient-to-r ${gradient}`}
            />
          </motion.div>
        </div>
      </div>

      {/* Floating Particles */}
      {isInView && (
        <motion.div
          animate={{
            y: [-20, -40, -20],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-4 right-1/4 w-2 h-2 rounded-full bg-cyan-400/60 blur-sm"
        />
      )}
    </motion.div>
  );
}

const metrics = [
  {
    value: 100,
    suffix: "+",
    label: "Issues Tracked",
    description: "Real-time monitoring across all campus infrastructure",
    gradient: "from-lavender-400 to-lavender-300",
  },
  {
    value: 42,
    suffix: "%",
    label: "Faster Resolution",
    description: "Average time reduced through intelligent prioritization",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    value: 89,
    suffix: "",
    label: "High-Risk Zones",
    description: "Identified early through predictive pattern analysis",
    gradient: "from-rose-500 to-orange-600",
  },
  {
    value: 94,
    suffix: "%",
    label: "Prediction Accuracy",
    description: "Rolling model performance validated against actual failures",
    gradient: "from-lavender-400 to-lavender-300",
  },
];

export function ImpactMetrics() {
  // System readout: no cards, no animation, no color reliance
  return (
    <section id="impact" className="relative py-20 px-6 overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-3 text-[#f5f6fa]">
            Numbers That <span className="text-[#bcb8ff]">Actually Matter</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-[#aeb6c2] mb-2">
            Real impact. Measured daily. Verified continuously.
          </p>
        </div>
        {/* Subtle horizontal anchor */}
        <div className="w-full h-px bg-[#bcb8ff11] mb-8" />
        {/* System Metrics Readout */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative"
          style={{ minHeight: 180 }}
        >
          {/* Metrics as floating cards */}
          {/* Issues Tracked */}
          <div
            className="bg-[#181a22] border border-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-start relative"
            style={{
              boxShadow: "0 4px 32px 0 rgba(20,22,30,0.13)",
              minHeight: 240,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#bcb8ff] mr-2">
                <svg
                  className="w-5 h-5 text-[#bcb8ff]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <span
                className="text-7xl font-extrabold text-[#f5f6fa] tracking-tight"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                100
              </span>
              <span className="text-3xl font-bold text-[#bcb8ff]">+</span>
            </div>
            <div
              className="text-xs text-[#b2b7c2] mt-1 tracking-wider uppercase"
              style={{ letterSpacing: "0.09em", opacity: 0.7 }}
            >
              Issues Tracked
            </div>
            <div
              className="text-[13px] text-[#aeb6c2] mt-0.5"
              style={{ opacity: 0.7 }}
            >
              Real-time monitoring across all infrastructure
            </div>
            <div className="absolute left-0 top-full mt-2 w-20 h-px bg-[#bcb8ff22]" />
            <div className="absolute left-0 top-full mt-4 text-[11px] text-[#b2b7c2]/60 tracking-tight">
              Updated: Now
            </div>
          </div>
          {/* Faster Resolution */}
          <div
            className="bg-[#181a22] border border-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-center relative"
            style={{
              boxShadow: "0 4px 32px 0 rgba(20,22,30,0.13)",
              minHeight: 240,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#7be7c6] mr-2">
                <svg
                  className="w-5 h-5 text-[#7be7c6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <span className="text-7xl font-extrabold text-[#f5f6fa] tracking-tight">
                42
              </span>
              <span className="text-3xl font-bold text-[#7be7c6]">%</span>
            </div>
            <div
              className="text-xs text-[#b2b7c2] mt-1 tracking-wider uppercase"
              style={{ letterSpacing: "0.09em", opacity: 0.7 }}
            >
              Faster Resolution
            </div>
            <div
              className="text-[13px] text-[#aeb6c2] mt-0.5"
              style={{ opacity: 0.7 }}
            >
              Avg. time reduced through intelligent prioritization
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-16 h-px bg-[#7be7c622]" />
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 text-[11px] text-[#b2b7c2]/60 tracking-tight">
              Updated: Now
            </div>
          </div>
          {/* High-Risk Zones */}
          <div
            className="bg-[#181a22] border border-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-end relative"
            style={{
              boxShadow: "0 4px 32px 0 rgba(20,22,30,0.13)",
              minHeight: 240,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#f7b955] mr-2">
                <svg
                  className="w-5 h-5 text-[#f7b955]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <span className="text-7xl font-extrabold text-[#f5f6fa] tracking-tight">
                89
              </span>
            </div>
            <div
              className="text-xs text-[#b2b7c2] mt-1 tracking-wider uppercase"
              style={{ letterSpacing: "0.09em", opacity: 0.7 }}
            >
              High-Risk Zones
            </div>
            <div
              className="text-[13px] text-[#aeb6c2] mt-0.5"
              style={{ opacity: 0.7 }}
            >
              Identified early through predictive pattern analysis
            </div>
            <div className="absolute right-0 top-full mt-2 w-14 h-px bg-[#f7b95522]" />
            <div className="absolute right-0 top-full mt-4 text-[11px] text-[#b2b7c2]/60 tracking-tight">
              Updated: Now
            </div>
          </div>
          {/* Prediction Accuracy */}
          <div
            className="bg-[#181a22] border border-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-end relative"
            style={{
              boxShadow: "0 4px 32px 0 rgba(20,22,30,0.13)",
              minHeight: 240,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#e48fcf] mr-2">
                <svg
                  className="w-5 h-5 text-[#e48fcf]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <span className="text-7xl font-extrabold text-[#f5f6fa] tracking-tight">
                94
              </span>
              <span className="text-3xl font-bold text-[#e48fcf]">%</span>
            </div>
            <div
              className="text-xs text-[#b2b7c2] mt-1 tracking-wider uppercase"
              style={{ letterSpacing: "0.09em", opacity: 0.7 }}
            >
              Prediction Accuracy
            </div>
            <div
              className="text-[13px] text-[#aeb6c2] mt-0.5"
              style={{ opacity: 0.7 }}
            >
              Rolling model performance validated against actual failures
            </div>
            <div className="absolute right-0 top-full mt-2 w-14 h-px bg-[#e48fcf22]" />
            <div className="absolute right-0 top-full mt-4 text-[11px] text-[#b2b7c2]/60 tracking-tight">
              Updated: Now
            </div>
          </div>
        </div>
        {/* Bottom Note */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#bcb8ff] opacity-60 animate-pulse" />
            <span className="text-white/70 text-sm">
              Metrics updated in real-time across all active infrastructure
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
