"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Compass } from "lucide-react";
import { FloatingNav } from "@/components/landing/FloatingNav";

export default function NotFound() {
  return (
    <>
      <FloatingNav />
      <main className="relative min-h-screen bg-[#0A0E1A] text-white overflow-hidden">
        {/* Enhanced Ambient Background Effects */}
        <div className="fixed inset-0 -z-10">
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-40 right-20 w-80 h-80 bg-blue-800/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Floating Geometric Shapes */}
        <div className="fixed inset-0 -z-5 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/30 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-3/4 right-1/4 w-3 h-3 bg-blue-700/20 rounded-full"
            animate={{
              y: [0, 25, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-1 h-1 bg-blue-500/40 rounded-full"
            animate={{
              x: [0, -15, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Content */}
        <div className="flex items-center justify-center min-h-screen px-6 relative z-10 pt-24">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* 404 Number with Animation */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-purple-200 via-blue-400 to-blue-800 bg-clip-text text-transparent leading-none">
                404
              </div>
              {/* Animated underline */}
              <motion.div
                className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-200 to-blue-800 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              />
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Oops! Page Not Found
              </h1>

              <p className="text-lg text-white/70 mb-10 leading-relaxed max-w-lg mx-auto">
                The page you're looking for seems to have wandered off into the
                digital void. Don't worry, let's get you back to exploring
                CampusCare!
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-800 hover:from-purple-700 hover:to-blue-900 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  <Home className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Take Me Home
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => window.history.back()}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white/20 hover:border-white/40 rounded-xl font-semibold transition-all duration-300 hover:bg-white/5 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Go Back
                </button>
              </motion.div>
            </motion.div>

            {/* Search Suggestion */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex items-center justify-center gap-2 text-white/60 mb-4">
                <Search className="w-4 h-4" />
                <span className="text-sm">
                  Try these popular pages instead:
                </span>
              </div>
            </motion.div>

            {/* Quick Links Grid */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              {[
                { href: "/dashboard", label: "Dashboard", icon: "📊" },
                { href: "/issues", label: "Issues", icon: "🚨" },
                { href: "/heatmap", label: "Heatmap", icon: "🗺️" },
                { href: "/documentation", label: "Docs", icon: "📚" },
              ].map((link, index) => (
                <motion.div
                  key={link.href}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Link
                    href={link.href}
                    className="group block p-4 rounded-lg border border-white/10 hover:border-purple-500/50 bg-white/5 hover:bg-purple-500/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      {link.icon}
                    </div>
                    <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                      {link.label}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Compass Animation */}
            <motion.div
              className="mt-16 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-6xl opacity-20"
              >
                🧭
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          className="absolute bottom-0 w-full border-t border-white/5 py-6 px-6 backdrop-blur-sm bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">© 2025 CampusCare</p>
            <div className="flex gap-6 text-sm text-white/40">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/documentation"
                className="hover:text-white transition-colors"
              >
                Documentation
              </Link>
            </div>
          </div>
        </motion.footer>
      </main>
    </>
  );
}
