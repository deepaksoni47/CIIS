"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { scrollY } = useScroll();

  const backgroundBlur = useTransform(scrollY, [0, 100], [0.3, 0.5]);

  // --- HELPER FOR ACTIVE STYLES ---
  // This function returns the class string based on whether the path matches
  const getNavLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `
    px-5 py-2 rounded-full text-sm font-medium transition-all
    ${
      isActive
        ? "bg-white/15 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.15)]" // Changed to text-green-400
        : "text-gray-200 hover:text-[#b7aaff] hover:bg-white/5"
    }
  `;
  };

  // Helper for Mobile menu items (slightly different padding/layout)
  const getMobileLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `
    px-5 py-3 rounded-xl text-sm font-medium transition-all text-center block w-full
    ${
      isActive
        ? "bg-white/15 text-green-400" // Changed to text-green-400
        : "text-gray-200 hover:text-[#b7aaff] hover:bg-white/5"
    }
  `;
  };

  // Check authentication state
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("campuscare_token");
        const userStr = window.localStorage.getItem("campuscare_user");

        if (token) {
          setIsLoggedIn(true);
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              setUserName(user.name || user.displayName || user.email || null);
              setUserRole(user.role || null);
            } catch {
              setUserName(null);
              setUserRole(null);
            }
          }
        } else {
          setIsLoggedIn(false);
          setUserName(null);
          setUserRole(null);
        }
      }
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);
    window.addEventListener("campuscare_auth_changed", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("campuscare_auth_changed", checkAuth);
    };
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
      const token = window.localStorage.getItem("campuscare_token");

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
          console.warn("Backend logout failed, continuing:", err);
        }
      }

      try {
        await signOut(auth);
      } catch (err) {
        console.warn("Firebase sign out failed:", err);
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("campuscare_token");
        window.localStorage.removeItem("campuscare_user");
      }

      setIsLoggedIn(false);
      setUserName(null);
      setIsMobileMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("campuscare_token");
        window.localStorage.removeItem("campuscare_user");
      }
      setIsLoggedIn(false);
      setUserName(null);
      router.push("/");
    }
  };

  return (
    <motion.nav
      className={`
        fixed top-4 md:top-6 left-1/2 z-50
        transition-all duration-300
        transform -translate-x-1/2
      `}
    >
      <div className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-full bg-[#0a0a12cc] backdrop-blur-xl border border-white/10 shadow-2xl">
        {/* Logo */}
        <motion.a
          href="/"
          className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-7 h-7 md:w-8 md:h-8 relative rounded-lg overflow-hidden">
            <Image
              src="/logo.png"
              alt="CampusCare"
              fill={false}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-sm md:text-base">
              <span className="text-blue-400">Campus</span>
              <span className="text-green-400">Care</span>
            </span>
            <div className="w-px h-6 bg-white/10" />
            <div className="w-px h-6 bg-white/7" />
          </div>
        </motion.a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 w-full">
          <div className="flex items-center gap-2">
            {/* Action Buttons - Desktop (left side) */}
            {isLoggedIn && (
              <>
                <motion.a
                  href="/dashboard"
                  className={getNavLinkClass("/dashboard")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.a>
                <motion.a
                  href="/report"
                  className={getNavLinkClass("/report")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Report Issue
                </motion.a>
                {userRole === "admin" && (
                  <motion.a
                    href="/admin"
                    className={getNavLinkClass("/admin")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Admin
                  </motion.a>
                )}
              </>
            )}

            <motion.a
              href="/heatmap"
              className={getNavLinkClass("/heatmap")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Heatmap
            </motion.a>

            <motion.a
              href="/priority"
              className={getNavLinkClass("/priority")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Priority
            </motion.a>
          </div>

          <div className="flex-1" />

          {/* Right side: user name (rightmost) or login button */}
          {isLoggedIn && userName ? (
            <div className="hidden md:flex items-center">
              <div className="w-px h-6 bg-white/10 mr-4" />
              <div className="w-px h-6 bg-white/7 mr-4" />
              <motion.a
                href="/profile"
                className={`
                    px-4 py-2 text-sm font-semibold transition-colors rounded-full 
                    ${
                      pathname === "/profile"
                        ? "text-green-400 bg-white/10" // Changed to text-green-400
                        : "text-[#b7aaff] hover:text-[#a18aff] hover:bg-white/5"
                    }
                  `}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                title="View Profile"
              >
                {userName}
              </motion.a>
            </div>
          ) : (
            <motion.a
              href="/login"
              className="px-6 py-2 rounded-full bg-[#5a5fcf] hover:bg-[#4346a1] text-white text-sm font-medium shadow-none"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(167,139,250,0.4)",
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
        <div className="flex flex-col gap-2 px-4 py-4 rounded-2xl bg-[#0a0a12cc] backdrop-blur-xl border border-white/10 shadow-2xl">
          {isLoggedIn && (
            <>
              <motion.a
                href="/dashboard"
                className={getMobileLinkClass("/dashboard")}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </motion.a>
              <motion.a
                href="/report"
                className={getMobileLinkClass("/report")}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Report Issue
              </motion.a>
              {userRole === "admin" && (
                <motion.a
                  href="/admin"
                  className={getMobileLinkClass("/admin")}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </motion.a>
              )}
            </>
          )}
          <motion.a
            href="/heatmap"
            className={getMobileLinkClass("/heatmap")}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Heatmap
          </motion.a>
          <motion.a
            href="/priority"
            className={getMobileLinkClass("/priority")}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Priorities
          </motion.a>
          {isLoggedIn ? (
            <div className="contents">
              {userName && (
                <motion.a
                  href="/profile"
                  className={getMobileLinkClass("/profile")}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {userName}
                </motion.a>
              )}
            </div>
          ) : (
            <motion.a
              href="/login"
              className="px-5 py-3 rounded-xl bg-[#5a5fcf] hover:bg-[#4346a1] text-white text-sm font-medium shadow-none text-center"
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
