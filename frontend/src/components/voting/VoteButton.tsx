"use client";

import { useState, useEffect } from "react";
import { voteOnIssue, unvoteOnIssue, checkUserVote } from "@/lib/api/rewards";
import { useAuth } from "@/lib/hooks/useAuth";

interface VoteButtonProps {
  issueId: string;
  initialVoteCount?: number;
  initialHasVoted?: boolean;
  onVoteChange?: (voteCount: number, hasVoted: boolean) => void;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function VoteButton({
  issueId,
  initialVoteCount = 0,
  initialHasVoted = false,
  onVoteChange,
  size = "md",
  showCount = true,
}: VoteButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkUserVote(issueId)
        .then((response) => {
          setHasVoted(response.data.hasVoted);
        })
        .catch((err) => console.error("Failed to check vote status:", err));
    }
  }, [issueId, user]);

  const handleVote = async () => {
    if (!user) {
      setError("Please sign in to vote");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (hasVoted) {
        const response = await unvoteOnIssue(issueId);
        const newVoteCount = response.data.voteCount;
        setVoteCount(newVoteCount);
        setHasVoted(false);
        onVoteChange?.(newVoteCount, false);
      } else {
        const response = await voteOnIssue(issueId);
        const newVoteCount = response.data.voteCount;
        setVoteCount(newVoteCount);
        setHasVoted(true);
        onVoteChange?.(newVoteCount, true);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to vote");
      console.error("Vote error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 min-w-[60px] text-xs gap-1",
    md: "h-10 min-w-[70px] text-sm gap-1.5",
    lg: "h-12 min-w-[80px] text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleVote}
        disabled={isLoading || !user}
        className={`
          flex items-center justify-center rounded-lg font-medium transition-all
          ${sizeClasses[size]}
          ${
            hasVoted
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
          }
          ${isLoading ? "opacity-50 cursor-wait" : ""}
          ${!user ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={
          !user
            ? "Sign in to vote"
            : hasVoted
              ? "Remove vote"
              : "Vote for this issue"
        }
      >
        <svg
          className={`${iconSizes[size]} ${hasVoted ? "fill-current" : "stroke-current"}`}
          viewBox="0 0 24 24"
          fill={hasVoted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
        {showCount && <span>{voteCount}</span>}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function VoteCount({
  count,
  size = "md",
}: {
  count: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={`flex items-center gap-1.5 text-gray-600 ${sizeClasses[size]}`}
    >
      <svg
        className={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
      </svg>
      <span className="font-medium">{count}</span>
      <span className="text-gray-500">vote{count !== 1 ? "s" : ""}</span>
    </div>
  );
}
