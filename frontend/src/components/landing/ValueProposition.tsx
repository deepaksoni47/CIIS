"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    number: "01",
    title: "Campus-Isolated Intelligence",
    description:
      "Each university sees only its own infrastructure data. No cross-campus noise. No irrelevant alerts. Every insight is context-aware and location-specific.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    number: "02",
    title: "Multi-Source Issue Reporting",
    description:
      "Issues can be submitted by authenticated users through text reports, voice input, or image evidence. All inputs are normalized, validated, and reflected instantly on the campus heatmap.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-500",
  },
  {
    number: "03",
    title: "Predictive, Not Reactive",
    description:
      "Historical patterns and live data power models that forecast likely failures, stress zones, and recurring infrastructure risks. Maintenance shifts from firefighting to foresight.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-500",
  },
];

export function ValueProposition() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      ref={ref}
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-sm font-medium">
              Why This System Exists
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Built Different.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Built Better.
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Not another dashboard. A complete intelligence platform designed for
            the complexity of modern campus infrastructure.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.number}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-white/20">
                {/* Animated Background Gradient */}
                <motion.div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient}`}
                  initial={false}
                />

                {/* Spotlight Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div
                    className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.gradient} blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20`}
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  {/* Number */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br ${feature.gradient} opacity-30`}
                    >
                      {feature.number}
                    </span>
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                    >
                      {feature.icon}
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white leading-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/60 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative Line */}
                  <motion.div
                    className={`h-1 rounded-full bg-gradient-to-r ${feature.gradient}`}
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "30%" } : {}}
                    transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                  />
                </div>

                {/* Hover Border Animation */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  initial={false}
                  whileHover={{
                    boxShadow: `0 0 0 2px rgba(6, 182, 212, 0.2)`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Connecting Lines */}
              {index < features.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-white/20 to-transparent z-20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
