"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  // For orbital dots
  const [orbitAngle, setOrbitAngle] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setOrbitAngle((prev) => (prev + 0.08) % (2 * Math.PI)); // slow, linear
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Get auth methods from hook
  const { getUser, isAuthenticated } = useAuth();

  // Local state to track authentication
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    setIsLoading(false);
  }, [isAuthenticated]);

  // Determine Button Logic
  const buttonText = isAuth ? "Go to Dashboard" : "Login to Get Started";
  const buttonLink = isAuth ? "/dashboard" : "/login";

  return (
    <section ref={ref} className="relative py-4 px-6 overflow-hidden">
      {/* Subtle radial light background */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div
          className="w-[600px] h-[600px] rounded-full bg-gradient-radial from-violet-500/20 via-transparent to-transparent opacity-80"
          style={{ filter: "blur(8px)" }}
        />
      </div>

      <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Rocket + Orbit Visual */}
        <div
          className="relative flex flex-col items-center mb-12"
          style={{ height: 180 }}
        >
          {/* Orbit line */}
          <svg
            width="160"
            height="160"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <circle
              cx="80"
              cy="80"
              r="68"
              stroke="#bcb8ff33"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          {/* Orbiting dots */}
          {[0, Math.PI].map((offset, i) => {
            const angle = orbitAngle + offset;
            const r = 68;
            const cx = 80 + r * Math.cos(angle);
            const cy = 80 + r * Math.sin(angle);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${r * Math.cos(angle) - 6}px)`,
                  top: `calc(50% + ${r * Math.sin(angle) - 6}px)`,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(90deg, #bcb8ff 60%, #a18aff 100%)",
                  boxShadow: "0 0 0 1px #bcb8ff44",
                  zIndex: 2,
                  transition: "background 0.2s",
                }}
              />
            );
          })}
          {/* Rocket Icon (centered) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: 3 }}
          >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient
                  id="rocket-gradient"
                  x1="0"
                  y1="0"
                  x2="64"
                  y2="64"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#bcb8ff" />
                  <stop offset="1" stopColor="#a18aff" />
                </linearGradient>
              </defs>
              <g>
                {/* Body */}
                <path
                  d="M32 8C36 20 36 44 32 56C28 44 28 20 32 8Z"
                  fill="url(#rocket-gradient)"
                  stroke="#bcb8ff"
                  strokeWidth="2"
                />
                {/* Fins */}
                <path
                  d="M32 56L24 60L32 48L40 60L32 56Z"
                  fill="#bcb8ff"
                  fillOpacity="0.7"
                />
                {/* Window */}
                <circle
                  cx="32"
                  cy="28"
                  r="5"
                  fill="#fff"
                  fillOpacity="0.7"
                  stroke="#bcb8ff"
                  strokeWidth="1.5"
                />
              </g>
            </svg>
          </div>
        </div>
        {/* Headline & Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-white leading-tight"
              style={{ letterSpacing: "-0.01em", lineHeight: 1.1 }}
            >
              Stop Reacting. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#bcb8ff] via-[#a18aff] to-[#bcb8ff]">
                Start Anticipating.
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/50 max-w-2xl mx-auto"
            >
              Built for campuses that take infrastructure seriously.
            </motion.p>
          </div>
          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative inline-block"
          >
            <Link href={buttonLink}>
              <motion.div
                whileHover={{
                  boxShadow: "0 0 0 4px #60a5fa33, 0 0 32px #60a5fa22",
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
                className={`relative inline-flex items-center gap-3 px-12 py-6 rounded-full text-white text-xl font-bold shadow-xl transition-all duration-300 group cursor-pointer ${isAuth ? "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700" : "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"}`}
                style={{ transition: "box-shadow 0.3s" }}
              >
                <span className="relative z-10">
                  {isLoading ? "Checking..." : buttonText}
                </span>
                <svg
                  className="relative z-10 w-6 h-6"
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
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
        {/* Trust Indicators (minimal, static) */}
        <div className="flex flex-wrap justify-center items-center gap-8 pt-12 opacity-60">
          {[
            {
              icon: (
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="#bcb8ff"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 2" />
                </svg>
              ),
              label: "Enterprise Security",
            },
            {
              icon: (
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="#bcb8ff"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12h8" />
                </svg>
              ),
              label: "Real-Time Updates",
            },
            {
              icon: (
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="#bcb8ff"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="3" />
                  <path d="M9 9h6v6H9z" />
                </svg>
              ),
              label: "AI-Powered",
            },
            {
              icon: (
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="#bcb8ff"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <rect x="4" y="4" width="16" height="16" rx="4" />
                  <path d="M8 8h8v8H8z" />
                </svg>
              ),
              label: "Advanced Analytics",
            },
          ].map((item, index) => (
            <div key={item.label} className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-white/60 text-sm font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
