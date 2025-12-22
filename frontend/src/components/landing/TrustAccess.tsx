"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
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
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    color: "purple",
  },
];

export function TrustAccess() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 px-6 overflow-hidden">
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
            Who Can{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Use It
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8">
            Role-based access. Verified actions. Full audit trail.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4">
            {["Verified Access", "Encrypted Data", "Audit Logged"].map(
              (badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <svg
                    className="w-4 h-4 text-cyan-400"
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
                  <span className="text-sm text-white/70">{badge}</span>
                </motion.div>
              )
            )}
          </div>
        </motion.div>

        {/* Roles Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.15 }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-white/30">
                {/* Hover Effect */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-${role.color}-500 to-${role.color}-600`}
                />

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-${role.color}-500 to-${role.color}-600 shadow-lg shadow-${role.color}-500/30`}
                  >
                    <div className="text-white">{role.icon}</div>
                  </motion.div>

                  {/* Title */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {role.title}
                    </h3>
                    <div
                      className={`inline-block px-3 py-1 rounded-full bg-${role.color}-500/10 border border-${role.color}-500/20`}
                    >
                      <span
                        className={`text-sm font-medium text-${role.color}-400`}
                      >
                        {role.access}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/60 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Action Link */}
                  <motion.a
                    href={`/auth?role=${role.title.toLowerCase()}`}
                    whileHover={{ x: 5 }}
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors group/link"
                  >
                    {/* <span>Learn more</span> */}
                    {/* <svg
                      className="w-4 h-4 group-hover/link:translate-x-1 transition-transform"
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
                    </svg> */}
                  </motion.a>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent" />
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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg">
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
