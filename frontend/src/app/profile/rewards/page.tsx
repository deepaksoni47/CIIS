"use client";

import { RewardsProfile } from "@/components/rewards/RewardsProfile";
import { BadgesGrid } from "@/components/rewards/BadgeCard";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState } from "react";

export default function ProfileRewardsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "badges">("overview");

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            Please sign in to view your rewards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Rewards & Achievements
        </h1>
        <p className="text-gray-600">
          Track your progress, earn badges, and climb the leaderboard
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <TabButton
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </TabButton>
        <TabButton
          active={activeTab === "badges"}
          onClick={() => setActiveTab("badges")}
        >
          🎖️ All Badges
        </TabButton>
      </div>

      {/* Content */}
      <div>
        {activeTab === "overview" && <RewardsProfile />}
        {activeTab === "badges" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Badge Collection
              </h2>
              <p className="text-gray-600">
                Complete challenges to unlock badges and earn reward points
              </p>
            </div>
            <BadgesGrid userId={user.uid} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 font-medium transition-colors border-b-2
        ${
          active
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-600 hover:text-gray-900"
        }
      `}
    >
      {children}
    </button>
  );
}
