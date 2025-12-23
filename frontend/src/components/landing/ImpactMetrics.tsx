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
    gradient: "from-violet-500 to-purple-600",
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
    gradient: "from-fuchsia-500 to-pink-600",
  },
];

export function ImpactMetrics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="impact"
      ref={ref}
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Numbers That{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-violet-400">
              Actually Matter
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Real impact. Measured daily. Verified continuously.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.label} {...metric} delay={index * 0.15} />
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-white/70 text-sm">
              Metrics updated in real-time across all active campuses
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
