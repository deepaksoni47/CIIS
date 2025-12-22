"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ChangePassword from "@/components/profile/ChangePassword";
import UserPreferences from "@/components/profile/UserPreferences";

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
    "profile" | "password" | "preferences"
  >("profile");

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("ciis_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Load user data from localStorage
    const userStr = localStorage.getItem("ciis_user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    setLoading(false);
  }, [router]);

  const handleUserUpdate = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem("ciis_user", JSON.stringify(newUser));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 pt-20 sm:pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="mt-4 sm:mt-0 sm:ml-4">
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                } catch (e) {
                  // ignore signOut errors but proceed to clear local state
                  console.warn("signOut failed:", e);
                }
                localStorage.removeItem("ciis_token");
                localStorage.removeItem("ciis_user");
                // notify other components in-tab
                window.dispatchEvent(new Event("ciis_auth_changed"));
                router.push("/");
              }}
              className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-t-xl border border-gray-700 p-1">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </div>
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === "password"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Password
              </div>
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === "preferences"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                Preferences
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-b-xl border border-t-0 border-gray-700 p-6">
          {activeTab === "profile" && (
            <ProfileInfo user={user} onUpdate={handleUserUpdate} />
          )}
          {activeTab === "password" && <ChangePassword />}
          {activeTab === "preferences" && (
            <UserPreferences user={user} onUpdate={handleUserUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}
