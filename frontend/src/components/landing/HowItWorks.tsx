"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Campus Selection",
    description: "Users enter a verified campus environment",
    detail: "Example: Guru Ghasidas University, Bilaspur",
    icon: "🎓",
    color: "blue",
  },
  {
    number: "02",
    title: "Real-Time Visibility",
    description: "Issues appear instantly on a geospatial heatmap",
    detail: "Mapped down to building → department → room level",
    icon: "🗺️",
    color: "cyan",
  },
  {
    number: "03",
    title: "Priority Intelligence",
    description:
      "Dynamic priority queue ranks issues by severity, impact, and risk",
    detail: "AI-powered urgency scoring",
    icon: "⚡",
    color: "amber",
  },
  {
    number: "04",
    title: "Resolution & Accountability",
    description: "Authorized users mark issues as resolved with proof",
    detail: "The heatmap updates immediately",
    icon: "✓",
    color: "emerald",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState(0);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-violet-500 to-purple-500",
      cyan: "from-fuchsia-500 to-pink-500",
      amber: "from-amber-500 to-orange-500",
      emerald: "from-emerald-500 to-green-500",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            How It{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
              Actually Works
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            From incident to insight. Four steps. Zero confusion.
          </p>
        </motion.div>

        {/* Steps Timeline */}
        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 via-rose-500 to-emerald-500 opacity-20" />

          {steps.map((step, index) => {
            const isActive = index === activeStep;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                onMouseEnter={() => setActiveStep(index)}
                className="relative group cursor-pointer"
              >
                {/* Step Number Circle */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  className="relative z-10 mx-auto w-20 h-20 mb-6 flex items-center justify-center"
                >
                  {/* Pulsing Ring */}
                  {isActive && (
                    <motion.div
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${getColorClasses(step.color)}`}
                    />
                  )}

                  {/* Main Circle */}
                  <div
                    className={`
                      relative w-full h-full rounded-full 
                      flex items-center justify-center
                      text-3xl
                      border-2 transition-all duration-300
                      ${
                        isActive
                          ? `bg-gradient-to-br ${getColorClasses(step.color)} border-white/40 shadow-2xl`
                          : "bg-white/5 border-white/20 group-hover:border-white/40"
                      }
                    `}
                  >
                    {step.icon}
                  </div>
                </motion.div>

                {/* Card Content */}
                <motion.div
                  animate={{
                    y: isActive ? -10 : 0,
                  }}
                  className={`
                    p-6 rounded-2xl backdrop-blur-sm transition-all duration-300
                    ${
                      isActive
                        ? "bg-white/10 border border-white/20 shadow-2xl"
                        : "bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/20"
                    }
                  `}
                >
                  {/* Step Number */}
                  <div
                    className={`text-sm font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${getColorClasses(step.color)}`}
                  >
                    STEP {step.number}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Detail */}
                  <div className="px-3 py-2 rounded-lg bg-black/30 border border-white/10">
                    <p className="text-xs text-white/80 italic">
                      {step.detail}
                    </p>
                  </div>
                </motion.div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-24 -right-4 z-20">
                    <svg
                      className="w-8 h-8 text-white/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p
            // href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-2xl hover:shadow-fuchsia-500/30 transition-all duration-300 group"
          >
            <span>Scroll to Explore</span>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
