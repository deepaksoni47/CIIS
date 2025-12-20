"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function FloatingNav() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [0, 1]);
  const y = useTransform(scrollY, [0, 100], [-20, 0]);

  // Check authentication state
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("ciis_token");
        const userStr = window.localStorage.getItem("ciis_user");
        
        if (token) {
          setIsLoggedIn(true);
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              setUserName(user.name || user.email || null);
            } catch {
              setUserName(null);
            }
          }
        } else {
          setIsLoggedIn(false);
          setUserName(null);
        }
      }
    };

    checkAuth();

    // Listen for storage changes (e.g., login/logout from another tab)
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      // Get token for backend logout call
      const token = window.localStorage.getItem("ciis_token");

      // Call backend logout endpoint (optional, but good practice)
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } catch (err) {
          // Backend logout failed, but continue with client-side cleanup
          console.warn("Backend logout failed, continuing with client-side logout:", err);
        }
      }

      // Sign out from Firebase Auth
      try {
        await signOut(auth);
      } catch (err) {
        // Firebase sign out failed, but continue with cleanup
        console.warn("Firebase sign out failed, continuing with cleanup:", err);
      }

      // Clear local storage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("ciis_token");
        window.localStorage.removeItem("ciis_user");
      }

      // Update state
      setIsLoggedIn(false);
      setUserName(null);

      // Close mobile menu if open
      setIsMobileMenuOpen(false);

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear local storage and redirect
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("ciis_token");
        window.localStorage.removeItem("ciis_user");
      }
      setIsLoggedIn(false);
      setUserName(null);
      router.push("/");
    }
  };

  return (
    <motion.nav
      style={{ opacity, y }}
      className={`
        fixed top-4 md:top-6 left-1/2 z-50
        transition-all duration-300
        ${isScrolled ? "translate-y-0" : "-translate-y-32"}
      `}
    >
      <div className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transform -translate-x-1/2">
        {/* Logo */}
        <motion.a
          href="/"
          className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-white"
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
          <span className="font-bold text-white text-sm md:text-base hidden sm:inline">
            CIIS
          </span>
        </motion.a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Action Buttons - Desktop */}
          {isLoggedIn && (
            <>
              <motion.a
                href="/dashboard"
                className="px-5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.a>
              <motion.a
                href="/report"
                className="px-5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Report Issue
              </motion.a>
            </>
          )}
          <motion.a
            href="/heatmap"
            className="px-5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Heatmap
          </motion.a>
          <motion.a
            href="/priorities"
            className="px-5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Priorities
          </motion.a>
          {isLoggedIn ? (
            <>
              {userName && (
                <span className="px-4 py-2 text-sm text-white/60">
                  {userName}
                </span>
              )}
              <motion.button
                onClick={handleLogout}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-medium shadow-lg shadow-rose-500/25"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(244, 63, 94, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </>
          ) : (
            <motion.a
              href="/login"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium shadow-lg shadow-violet-500/25"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(167, 139, 250, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.a>
          )}
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-full hover:bg-white/5 transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </motion.button>
      </div>

      {/* Mobile Dropdown Menu */}
      <motion.div
        initial={false}
        animate={{
          height: isMobileMenuOpen ? "auto" : 0,
          opacity: isMobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="md:hidden overflow-hidden mt-2"
      >
        <div className="flex flex-col gap-2 px-4 py-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          {isLoggedIn && (
            <>
              <motion.a
                href="/dashboard"
                className="px-5 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all text-center"
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </motion.a>
              <motion.a
                href="/report"
                className="px-5 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all text-center"
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Report Issue
              </motion.a>
            </>
          )}
          <motion.a
            href="/heatmap"
            className="px-5 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all text-center"
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Heatmap
          </motion.a>
          <motion.a
            href="/priorities"
            className="px-5 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all text-center"
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Priorities
          </motion.a>
          {isLoggedIn ? (
            <>
              {userName && (
                <div className="px-5 py-2 text-sm text-white/60 text-center border-b border-white/10">
                  {userName}
                </div>
              )}
              <motion.button
                onClick={handleLogout}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-medium shadow-lg shadow-rose-500/25 text-center"
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </>
          ) : (
            <motion.a
              href="/login"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium shadow-lg shadow-violet-500/25 text-center"
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </motion.a>
          )}
        </div>
      </motion.div>
    </motion.nav>
  );
}
