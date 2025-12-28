"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ChangePassword from "@/components/profile/ChangePassword";
import { RewardsProfile } from "@/components/rewards/RewardsProfile";
import { BadgesGrid } from "@/components/rewards/BadgeCard";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { ChartNoAxesColumn, Key, User, Trophy, Award } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  departmentId?: string;
  phone?: string;
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    theme?: "light" | "dark" | "system";
    language?: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "rewards" | "badges" | "leaderboard" | "password"
  >("profile");

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("campuscare_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Load user data from localStorage
    const userStr = localStorage.getItem("campuscare_user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    // Check for tab parameter in URL or hash
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    const hash = window.location.hash.replace("#", "");

    if (
      tabParam &&
      ["profile", "rewards", "badges", "leaderboard", "password"].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam as any);
    } else if (
      hash &&
      ["profile", "rewards", "badges", "leaderboard", "password"].includes(hash)
    ) {
      setActiveTab(hash as any);
    }

    setLoading(false);
  }, [router]);

  const handleUserUpdate = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem("campuscare_user", JSON.stringify(newUser));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-400"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="relative min-h-screen bg-[#050814] text-white overflow-hidden pb-20">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[36rem] h-[36rem] bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_55%,_#020617_100%)] opacity-60" />
      </div>

      <div className="container mx-auto px-4 pt-24 md:pt-32 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                  My{" "}
                  <span className="gradient-heading bg-clip-text text-transparent">
                    Profile
                  </span>
                </h1>
                <p className="text-white/60 text-base md:text-lg">
                  Manage your account, track achievements, and view leaderboard
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <button
                  onClick={async () => {
                    try {
                      await signOut(auth);
                    } catch (e) {
                      console.warn("signOut failed:", e);
                    }
                    localStorage.removeItem("campuscare_token");
                    localStorage.removeItem("campuscare_user");
                    window.dispatchEvent(new Event("campuscare_auth_changed"));
                    router.push("/");
                  }}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 md:gap-4 mb-8"
          >
            {[
              { id: "profile", label: "Profile Info", icon: <User /> },
              { id: "rewards", label: "Rewards", icon: <Trophy /> },
              { id: "badges", label: "Badges", icon: <Award /> },
              {
                id: "leaderboard",
                label: "Leaderboard",
                icon: <ChartNoAxesColumn />,
              },
              { id: "password", label: "Password", icon: <Key /> },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all text-sm md:text-base flex flex-row justify-center ${
                  activeTab === id
                    ? "bg-gradient-to-r from-indigo-500 to-violet-800 text-white shadow-lg"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
            >
              {activeTab === "profile" && (
                <ProfileInfo user={user} onUpdate={handleUserUpdate} />
              )}
              {activeTab === "rewards" && <RewardsProfile />}
              {activeTab === "badges" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Badge Collection
                  </h2>
                  <BadgesGrid userId={user.id} />
                </div>
              )}
              {activeTab === "leaderboard" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Community Leaderboard
                  </h2>
                  <Leaderboard organizationId={user.organizationId} />
                </div>
              )}
              {activeTab === "password" && <ChangePassword />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
