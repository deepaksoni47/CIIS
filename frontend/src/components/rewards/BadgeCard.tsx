"use client";

import { useEffect, useState } from "react";
import { Badge as BadgeType, getAllBadges } from "@/lib/api/rewards";

interface BadgeCardProps {
  badge: BadgeType;
  earned?: boolean;
  progress?: number;
  earnedAt?: string;
}

export function BadgeCard({
  badge,
  earned = false,
  progress,
  earnedAt,
}: BadgeCardProps) {
  const rarityColors = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-lavender-400 to-lavender-300",
    legendary: "from-yellow-400 to-orange-600",
  };

  const rarityBorders = {
    common: "border-gray-300",
    rare: "border-blue-400",
    epic: "border-purple-400",
    legendary: "border-yellow-400",
  };

  const rarityGlow = {
    common: "shadow-gray-300/50",
    rare: "shadow-blue-400/50",
    epic: "shadow-purple-400/50",
    legendary: "shadow-yellow-400/50",
  };

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${earned ? rarityBorders[badge.rarity] : "border-gray-300"}
        ${earned ? "shadow-lg " + rarityGlow[badge.rarity] : "shadow-sm"}
        ${!earned ? "opacity-60 grayscale" : ""}
        hover:scale-105
      `}
    >
      {/* Badge Icon */}
      <div className="flex justify-center mb-3">
        <div
          className={`
            w-16 h-16 rounded-full flex items-center justify-center text-3xl
            ${earned ? `bg-gradient-to-br ${rarityColors[badge.rarity]}` : "bg-gray-300"}
          `}
        >
          {badge.icon}
        </div>
      </div>

      {/* Badge Name */}
      <h3 className="text-center font-semibold text-gray-900 mb-1">
        {badge.name}
      </h3>

      {/* Badge Description */}
      <p className="text-xs text-center text-gray-600 mb-2 line-clamp-2">
        {badge.description}
      </p>

      {/* Badge Details */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="capitalize">{badge.rarity}</span>
        <span>{badge.pointsAwarded} pts</span>
      </div>

      {/* Progress Bar (if not earned) */}
      {!earned && progress !== undefined && (
        <div className="mt-2">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${rarityColors[badge.rarity]} transition-all`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-500 mt-1">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {/* Earned Date */}
      {earned && earnedAt && (
        <p className="text-xs text-center text-gray-500 mt-2">
          Earned {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}

      {/* Locked Overlay */}
      {!earned && (
        <div className="absolute top-2 right-2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export function BadgesGrid({ userId: _userId }: { userId?: string }) {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBadges()
      .then((response) => {
        setBadges(response.data.badges);
      })
      .catch((err) => console.error("Failed to fetch badges:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No badges available yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
}
