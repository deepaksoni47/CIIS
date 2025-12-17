"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const coordinates = [
  { label: "Campus Center", coords: "22.1310°N, 82.1495°E", color: "cyan" },
  { label: "North-West Bound", coords: "22.1515°N, 82.1340°E", color: "blue" },
  {
    label: "South-East Bound",
    coords: "22.1150°N, 82.1655°E",
    color: "purple",
  },
];

export function LiveDataTrust() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Grounded in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Real Geography
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            The system operates on accurate campus boundaries and spatial
            intelligence. Precision, not approximation.
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative p-12 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl overflow-hidden"
        >
          {/* Animated Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-50" />

          {/* Content */}
          <div className="relative z-10">
            {/* Title */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">
                GGV Main Campus Coverage
              </h3>
            </div>

            {/* Coordinates Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {coordinates.map((coord, index) => (
                <motion.div
                  key={coord.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="p-6 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-sm"
                >
                  <div
                    className={`inline-block px-3 py-1 rounded-full bg-${coord.color}-500/10 border border-${coord.color}-500/20 text-${coord.color}-400 text-xs font-medium mb-3`}
                  >
                    {coord.label}
                  </div>
                  <div className="font-mono text-lg text-white/90">
                    {coord.coords}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Features List */}
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Accurate building-level positioning",
                "Real-time coordinate validation",
                "Department-to-room mapping",
                "Scalable multi-campus support",
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <svg
                    className="w-5 h-5 text-cyan-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white/80">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Decorative Corner Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-transparent blur-3xl" />
        </motion.div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center text-white/40 text-sm mt-8"
        >
          All coordinates verified against official campus maps. Updated
          quarterly.
        </motion.p>
      </div>
    </section>
  );
}
