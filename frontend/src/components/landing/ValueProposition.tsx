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
    gradient: "from-indigo-300 to-lavender-400",
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
    gradient: "from-lavender-400 to-lavender-300",
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
      className="relative py-20 px-6 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-lavender-400/10 rounded-full blur-3xl" />
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
            <span className="px-4 py-2 rounded-full border border-cyan-400/15 bg-cyan-900/10 text-cyan-300/80 text-sm font-medium">
              Why This System Exists
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-white">Built Different.</span>{" "}
            <span className="gradient-heading">Built Better.</span>
          </h2>
          <p className="text-lg text-[#aeb6c2] max-w-2xl mx-auto">
            Not another dashboard. A complete intelligence platform designed for
            the complexity of modern campus infrastructure.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            let accent = "";
            let iconColor = "";
            if (index === 0) {
              accent = "#a18aff";
              iconColor = "#a18aff";
            }
            if (index === 1) {
              accent = "#e48fcf";
              iconColor = "#e48fcf";
            }
            if (index === 2) {
              accent = "#f7b955";
              iconColor = "#f7b955";
            }
            return (
              <motion.div
                key={feature.number}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative"
                style={{
                  boxShadow:
                    "0 1.5px 8px 0 rgba(10,12,20,0.13), 0 0.5px 0 0 #23242a inset",
                  borderRadius: "1.5rem",
                }}
              >
                <div
                  className="relative h-full p-8 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, #181a22 90%, #15161c 100%)",
                    boxShadow: "inset 0 1.5px 8px 0 rgba(255,255,255,0.04)",
                    borderRadius: "1.5rem",
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: "1.5rem",
                      boxShadow:
                        "inset 0 2px 8px 0 rgba(255,255,255,0.07), inset 0 -2px 8px 0 rgba(0,0,0,0.13)",
                    }}
                  />
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                      <span
                        className="text-6xl font-bold select-none"
                        style={{
                          color: accent,
                          opacity: 0.25,
                          letterSpacing: "-0.04em",
                          fontWeight: 800,
                          userSelect: "none",
                        }}
                        aria-hidden="true"
                      >
                        {feature.number}
                      </span>
                      <div
                        className="p-4 rounded-xl flex items-center justify-center"
                        style={{
                          background: "none",
                          boxShadow: "none",
                          minWidth: 48,
                          minHeight: 48,
                        }}
                        aria-hidden="true"
                      >
                        {feature.icon && (
                          <span
                            style={{
                              color: iconColor,
                              display: "inline-flex",
                              filter: "saturate(0.7) brightness(0.93)",
                            }}
                          >
                            {feature.icon.type === "svg"
                              ? {
                                  ...feature.icon,
                                  props: {
                                    ...feature.icon.props,
                                    fill: iconColor,
                                    stroke: iconColor,
                                  },
                                }
                              : feature.icon}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3
                      className="text-2xl font-extrabold text-white leading-tight tracking-tight"
                      style={{ fontWeight: 800 }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="text-[#b2b7c2] text-base leading-relaxed"
                      style={{
                        lineHeight: 1.6,
                        fontWeight: 400,
                        marginBottom: 0,
                      }}
                    >
                      {feature.description}
                    </p>
                    <div
                      className="mt-2"
                      style={{
                        width: 32,
                        height: 2,
                        borderRadius: 2,
                        background: `${accent}55`,
                        marginLeft: 0,
                        marginTop: 2,
                      }}
                    />
                  </div>
                </div>
                {index < features.length - 1 && (
                  <div
                    className="hidden md:block absolute top-1/2 -right-4 w-8 h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, #fff2 0%, transparent 100%)",
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
