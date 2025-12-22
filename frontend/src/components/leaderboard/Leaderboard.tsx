"use client";

import { useEffect, useState } from "react";
import { LeaderboardEntry, getLeaderboard } from "@/lib/api/rewards";

type Period = "all_time" | "monthly" | "weekly";

export function Leaderboard({ organizationId }: { organizationId: string }) {
  const [period, setPeriod] = useState<Period>("all_time");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log(
      `Fetching leaderboard for org: ${organizationId}, period: ${period}`
    );
    getLeaderboard(organizationId, period, 100)
      .then((response) => {
        console.log(`Received leaderboard data:`, response.data);
        const data = response.data.leaderboard || [];
        console.log(`Leaderboard has ${data.length} entries`);
        setLeaderboard(data);
      })
      .catch((err) => {
        const errorMsg = err.message || "Failed to load leaderboard";
        setError(errorMsg);
        console.error("Failed to fetch leaderboard:", err);
        setLeaderboard([]); // Set empty array on error
      })
      .finally(() => setLoading(false));
  }, [organizationId, period]);

  return (
    <div className="space-y-6">
      {/* Period Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <TabButton
          active={period === "all_time"}
          onClick={() => setPeriod("all_time")}
        >
          🏆 All Time
        </TabButton>
        <TabButton
          active={period === "monthly"}
          onClick={() => setPeriod("monthly")}
        >
          📅 This Month
        </TabButton>
        <TabButton
          active={period === "weekly"}
          onClick={() => setPeriod("weekly")}
        >
          📊 This Week
        </TabButton>
      </div>

      {/* Leaderboard Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : !leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">
            No leaderboard data available
          </p>
          <p className="text-gray-500 text-sm">
            Organization ID: {organizationId}
          </p>
          <p className="text-gray-500 text-sm">Period: {period}</p>
          <p className="text-gray-500 text-sm mt-4">
            Make sure users exist in your organization and check the browser
            console for details.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <LeaderboardCard key={entry.id} entry={entry} position={index} />
          ))}
        </div>
      )}
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

function LeaderboardCard({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: number;
}) {
  const isTopThree = position < 3;
  const medals = ["🥇", "🥈", "🥉"];

  const topThreeColors = [
    "from-yellow-50 to-yellow-100 border-yellow-400",
    "from-gray-50 to-gray-200 border-gray-400",
    "from-orange-50 to-orange-100 border-orange-400",
  ];

  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-lg border transition-all
        ${isTopThree ? `bg-gradient-to-r ${topThreeColors[position]} shadow-lg` : "bg-white border-gray-200 shadow-sm hover:shadow-md"}
      `}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-12 text-center">
        {isTopThree ? (
          <span className="text-3xl">{medals[position]}</span>
        ) : (
          <span className="text-xl font-bold text-gray-600">#{entry.rank}</span>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">
          {entry.userName}
        </h3>
        <p className="text-sm text-gray-600 capitalize">
          {entry.userRole.replace("_", " ")}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="font-bold text-gray-900">Level {entry.level}</div>
          <div className="text-xs text-gray-600">
            {entry.rewardPoints.toLocaleString()} pts
          </div>
        </div>

        <div className="text-center">
          <div className="font-bold text-gray-900">{entry.issuesReported}</div>
          <div className="text-xs text-gray-600">Reports</div>
        </div>

        <div className="text-center">
          <div className="font-bold text-gray-900">{entry.votesReceived}</div>
          <div className="text-xs text-gray-600">Votes</div>
        </div>

        <div className="text-center">
          <div className="font-bold text-gray-900">{entry.badges.length}</div>
          <div className="text-xs text-gray-600">Badges</div>
        </div>
      </div>
    </div>
  );
}
