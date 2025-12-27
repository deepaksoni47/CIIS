"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { FloatingNav } from "@/components/landing/FloatingNav";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <FloatingNav />
      <main className="relative min-h-screen bg-[#0A0E1A] text-white overflow-hidden">
        {/* Enhanced Ambient Background Effects */}
        <div className="fixed inset-0 -z-10">
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
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
            className="absolute bottom-40 right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"
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
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"
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
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/30 rounded-full"
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
            className="absolute top-3/4 right-1/4 w-3 h-3 bg-orange-400/20 rounded-full"
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
            className="absolute top-1/2 right-1/3 w-1 h-1 bg-yellow-400/40 rounded-full"
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
            {/* Error Icon */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-8xl mx-auto mb-4">⚠️</div>
              <div className="text-6xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                ERROR
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Something Went Wrong
              </h1>

              <p className="text-lg text-white/70 mb-4 leading-relaxed max-w-lg mx-auto">
                We encountered an unexpected error. Our team has been notified
                and is working to fix it.
              </p>

              {process.env.NODE_ENV === "development" && (
                <details className="mb-8 text-left bg-white/5 p-4 rounded-lg border border-white/10">
                  <summary className="cursor-pointer text-white/60 hover:text-white">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-red-400 overflow-auto">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}
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
                <button
                  onClick={reset}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Try Again
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white/20 hover:border-white/40 rounded-xl font-semibold transition-all duration-300 hover:bg-white/5 backdrop-blur-sm"
                >
                  <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Go Home
                </Link>
              </motion.div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-white/60 mb-4">Quick Navigation</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/issues"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                >
                  Issues
                </Link>
                <Link
                  href="/documentation"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                >
                  Docs
                </Link>
              </div>
            </motion.div>

            {/* Support Info */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <p className="text-white/60 text-sm">
                Need help? Contact our support team at{" "}
                <a
                  href="mailto:support@campuscare.edu"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  support@campuscare.edu
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          className="absolute bottom-0 w-full border-t border-white/5 py-6 px-6 backdrop-blur-sm bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
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
