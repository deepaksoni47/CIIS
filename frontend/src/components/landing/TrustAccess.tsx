"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Card color/gradient/icon/badge maps (move outside component for type safety)
const cardGradients: Record<string, string> = {
  blue: "from-cyan-400/20 via-cyan-600/10 to-blue-900/10",
  emerald: "from-emerald-400/20 via-emerald-600/10 to-emerald-900/10",
  purple: "from-fuchsia-400/20 via-purple-600/10 to-purple-900/10",
};
const cardShadows: Record<string, string> = {
  blue: "shadow-cyan-400/20",
  emerald: "shadow-emerald-400/20",
  purple: "shadow-fuchsia-400/20",
};
const iconBg: Record<string, string> = {
  blue: "bg-cyan-400/90",
  emerald: "bg-emerald-400/90",
  purple: "bg-fuchsia-400/90",
};
const iconBorder: Record<string, string> = {
  blue: "border-cyan-400",
  emerald: "border-emerald-400",
  purple: "border-fuchsia-400",
};
const iconGlow: Record<string, string> = {
  blue: "shadow-[0_0_16px_0_rgba(34,211,238,0.25)]",
  emerald: "shadow-[0_0_16px_0_rgba(52,211,153,0.22)]",
  purple: "shadow-[0_0_16px_0_rgba(232,121,249,0.22)]",
};
const badgeBg: Record<string, string> = {
  blue: "bg-cyan-400/20 border-cyan-400/40",
  emerald: "bg-emerald-400/20 border-emerald-400/40",
  purple: "bg-fuchsia-400/20 border-fuchsia-400/40",
};
const badgeText: Record<string, string> = {
  blue: "text-cyan-300",
  emerald: "text-emerald-300",
  purple: "text-fuchsia-300",
};

const roles = [
  {
    title: "Students",
    access: "Issue Reporting",
    description:
      "Submit text, voice, or image-based reports. Track status in real-time.",
    icon: (
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
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    color: "blue",
  },
  {
    title: "Facility Teams",
    access: "Resolution & Monitoring",
    description:
      "Mark issues resolved. Attach proof. Update status. Monitor patterns.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-handshake-icon lucide-handshake"
      >
        <path d="m11 17 2 2a1 1 0 1 0 3-3" />
        <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
        <path d="m21 3 1 11h-2" />
        <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
        <path d="M3 4h8" />
      </svg>
    ),
    color: "emerald",
  },
  {
    title: "Administrators",
    access: "Analytics & Prediction",
    description:
      "View trends. Access predictions. Generate reports. Manage access.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-shield-user-icon lucide-shield-user"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
        <circle cx="12" cy="11" r="4" />
      </svg>
    ),
    color: "purple",
  },
];

export function TrustAccess() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 px-6 overflow-hidden">
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
          <h2 className="text-4xl md:text-6xl font-bold mb-7">
            <span className="text-white">Who Can</span>{" "}
            <span className="text-[#bcb8ff]">Use It</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Role-based access. Verified actions. Full audit trail.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4">
            {["Verified Access", "Encrypted Data", "Audit Logged"].map(
              (badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.7, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 backdrop-blur-sm shadow-md shadow-cyan-400/10"
                >
                  <svg
                    className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_4px_rgba(94,234,212,0.25)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-sm text-cyan-100 font-medium tracking-wide">
                    {badge}
                  </span>
                </motion.div>
              )
            )}
          </div>
        </motion.div>

        {/* Roles Grid */}
        <div className="grid md:grid-cols-3 gap-10">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.2 + index * 0.18 }}
              className={`group relative`}
            >
              {/* Card */}
              <div
                className={`relative h-full p-9 rounded-3xl bg-gradient-to-br ${cardGradients[role.color]} border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-700 ${cardShadows[role.color]} group-hover:shadow-2xl group-hover:scale-[1.025] group-hover:border-white/20`}
                style={{ boxShadow: "0 6px 32px 0 rgba(0,0,0,0.10)" }}
              >
                {/* Subtle inner gradient on hover */}
                <div
                  className={`absolute inset-0 pointer-events-none transition-all duration-700 opacity-0 group-hover:opacity-100 bg-gradient-to-tr ${cardGradients[role.color]}`}
                />

                {/* Content */}
                <div className="relative z-10 space-y-7">
                  {/* Icon */}
                  <div
                    className={`mx-auto mb-2 flex items-center justify-center w-16 h-16 rounded-2xl border-2 ${iconBorder[role.color]} ${iconGlow[role.color]} transition-all duration-700`}
                    style={{ filter: "drop-shadow(0 0 8px rgba(0,0,0,0.10))" }}
                  >
                    <div className="w-9 h-9 flex items-center justify-center text-white">
                      {role.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {role.title}
                    </h3>
                    <div
                      className={`inline-block px-4 py-1.5 rounded-full border font-semibold text-base shadow-sm ${badgeBg[role.color]}`}
                      style={{ boxShadow: "0 1px 6px 0 rgba(0,0,0,0.08)" }}
                    >
                      <span
                        className={`${badgeText[role.color]} font-semibold tracking-wide`}
                      >
                        {role.access}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 leading-relaxed text-center">
                    {role.description}
                  </p>

                  {/* Action Link (hidden, reserved for future) */}
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl border-2 border-violet-400 shadow-lg">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">
                  Enterprise-Grade Security
                </h4>
                <p className="text-white/50 text-sm">
                  Firebase Authentication • Role-based permissions • End-to-end
                  encryption
                </p>
              </div>
            </div>
            <a
              href="/security"
              className="px-6 py-3 rounded-full border border-white/20 hover:border-white/40 text-white font-medium transition-all hover:bg-white/5"
            >
              Security Details
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
