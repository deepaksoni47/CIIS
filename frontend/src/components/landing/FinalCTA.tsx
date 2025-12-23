"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { GlobeLock,Radio,Bot,ChartNoAxesCombined  } from "lucide-react";

export function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
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
    <section ref={ref} className="relative py-40 px-6 overflow-hidden">
      {/* Background animations */}
      
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          {/* Headline & Text */}
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-white leading-tight"
            >
              Stop Reacting. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative inline-block"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 blur-2xl"
            />

            <Link href={buttonLink}>
                <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(217, 70, 239, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="relative inline-flex items-center gap-3 px-12 py-6 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-size-200 hover:bg-pos-100 text-white text-xl font-bold shadow-2xl shadow-fuchsia-500/30 transition-all duration-300 group cursor-pointer"
                >
                <motion.div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30"
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                    backgroundSize: "200% 100%",
                    }}
                />

                <span className="relative z-10">
                    {isLoading ? "Checking..." : buttonText}
                </span>

                <motion.svg
                    className="relative z-10 w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
                </motion.div>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
           <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="space-y-4"
          >
            {/* <p className="text-white/40 text-sm">
              No credit card required. Instant access. Cancel anytime.
            </p> */}

            <div className="flex flex-wrap justify-center items-center gap-8 pt-8">
              {[
                { icon: <GlobeLock />, label: "Enterprise Security" },
                { icon: <Radio />, label: "Real-Time Updates" },
                { icon: <Bot />, label: "AI-Powered" },
                { icon: <ChartNoAxesCombined />, label: "Advanced Analytics" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-white/60 text-sm font-medium">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
        
        {/* Decorative dots */}
         <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-cyan-400/50"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
