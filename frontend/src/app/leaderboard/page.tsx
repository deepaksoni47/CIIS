"use client";

import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LeaderboardPage() {
  const { user } = useAuth();

  // In a real app, you'd get the organizationId from user context or URL
  const organizationId = user?.organizationId || "default-org";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-heading">
          🏆 Leaderboard
        </h1>
        <p className="text-gray-600">
          See how you rank against other community members
        </p>
      </div>

      <Leaderboard organizationId={organizationId} />
    </div>
  );
}
