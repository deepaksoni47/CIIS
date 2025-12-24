"use client";

import { useEffect, useState } from "react";
import { UserRewards, getMyRewards } from "@/lib/api/rewards";

export function RewardsProfile() {
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyRewards()
      .then((response) => {
        setRewards(response.data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load rewards");
        console.error("Failed to fetch rewards:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-40 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error || !rewards) {
    return (
      <div className="text-center py-8 text-red-600">
        {error || "Failed to load rewards"}
      </div>
    );
  }

  const levelThresholds = [
    0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000,
  ];
  const currentLevelPoints = levelThresholds[rewards.level - 1];
  const nextLevelPoints =
    rewards.level < 10 ? levelThresholds[rewards.level] : currentLevelPoints;
  const progressPercentage =
    rewards.level < 10
      ? ((rewards.rewardPoints - currentLevelPoints) /
          (nextLevelPoints - currentLevelPoints)) *
        100
      : 100;

  return (
    <div className="space-y-6">
      {/* Level & Points Card */}
      <div className="bg-gradient-to-br from-blue-500 to-lavender-400 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Level {rewards.level}</h2>
            <p className="text-blue-100 text-sm">
              {rewards.rewardPoints.toLocaleString()} total points
            </p>
          </div>
          <div className="text-6xl">🏆</div>
        </div>

        {/* Progress Bar */}
        {rewards.level < 10 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {rewards.level}</span>
              <span>Level {rewards.level + 1}</span>
            </div>
            <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-blue-100 text-center">
              {rewards.nextLevelPoints} points to next level
            </p>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon="📝"
          label="Issues Reported"
          value={rewards.statistics.issuesReported}
          color="blue"
        />
        <StatCard
          icon="✅"
          label="Issues Resolved"
          value={rewards.statistics.issuesResolved}
          color="green"
        />
        <StatCard
          icon="👍"
          label="Votes Received"
          value={rewards.statistics.votesReceived}
          color="purple"
        />
        <StatCard
          icon="🗳️"
          label="Votes Cast"
          value={rewards.statistics.votesCast}
          color="orange"
        />
        <StatCard
          icon="⭐"
          label="Helpful Reports"
          value={rewards.statistics.helpfulReports}
          color="yellow"
        />
        <StatCard
          icon="🎖️"
          label="Badges Earned"
          value={rewards.badges.length}
          color="pink"
        />
      </div>

      {/* Badges Preview */}
      {rewards.badges.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Badges
          </h3>
          <div className="flex flex-wrap gap-3">
            {rewards.badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                title={badge.description}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <span className="text-xs text-gray-700 font-medium text-center">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
          {rewards.badges.length > 6 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              +{rewards.badges.length - 6} more badges
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "orange" | "yellow" | "pink";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 border-blue-200",
    green: "from-green-50 to-green-100 border-green-200",
    purple: "from-lavender-50 to-lavender-100 border-lavender-200",
    orange: "from-orange-50 to-orange-100 border-orange-200",
    yellow: "from-yellow-50 to-yellow-100 border-yellow-200",
    pink: "from-lavender-50 to-lavender-100 border-lavender-200",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border shadow-sm`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 font-medium">{label}</div>
    </div>
  );
}
