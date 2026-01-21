"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { VoteButton } from "@/components/voting/VoteButton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

// --- Types ---
interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: number;
  priority: string;
  status: string;
  location?: { latitude: number; longitude: number };
  images?: string[];
  reportedBy: string;
  createdAt: any;
  voteCount?: number;
  votedBy?: string[];
}

interface UserData {
  id: string;
  name: string;
  role: string;
  organizationId: string;
}

export default function IssuesPage() {
  const router = useRouter();

  // --- State ---
  const [user, setUser] = useState<UserData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filters & Pagination
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyIssuesOnly, setShowMyIssuesOnly] = useState(false);
  const [specificIssueIds, setSpecificIssueIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  // --- Initialization ---
  useEffect(() => {
    const userStr =
      typeof window !== "undefined"
        ? window.localStorage.getItem("campuscare_user")
        : null;
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      // Default to "My Issues" if user is a student
      if (userData.role === "student") {
        setShowMyIssuesOnly(true);
      }

      // Check for specific issue IDs in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const issueIdsParam = urlParams.get("issueIds");
      if (issueIdsParam) {
        const ids = issueIdsParam.split(",").filter((id) => id.trim());
        setSpecificIssueIds(ids);
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  // --- Data Fetching ---
  const fetchIssues = useCallback(
    async (isLoadMore = false) => {
      if (!user) return;

      try {
        setIsLoading(true);
        const token = window.localStorage.getItem("campuscare_token");

        // If we have specific issue IDs to filter by, fetch all issues and filter client-side
        if (specificIssueIds.length > 0 && !isLoadMore) {
          const queryParams = new URLSearchParams({
            organizationId: user.organizationId,
            // No limit to fetch all issues for filtering
            offset: "0",
          });

          const response = await fetch(
            `${API_BASE_URL}/api/issues?${queryParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (response.ok) {
            const result = await response.json();
            const allIssues = result.data || [];
            const filteredIssues = allIssues.filter((issue: Issue) =>
              specificIssueIds.includes(issue.id),
            );
            setIssues(filteredIssues);
            setHasMore(false); // No pagination for filtered results
          }
        } else {
          // Normal fetch with pagination
          const offset = isLoadMore ? issues.length : 0;
          const queryParams = new URLSearchParams({
            organizationId: user.organizationId,
            limit: ITEMS_PER_PAGE.toString(),
            offset: offset.toString(),
          });

          if (filterStatus !== "all")
            queryParams.append("status", filterStatus.toUpperCase());
          if (filterPriority !== "all")
            queryParams.append("priority", filterPriority.toUpperCase());
          if (showMyIssuesOnly) queryParams.append("reportedBy", user.id);

          const response = await fetch(
            `${API_BASE_URL}/api/issues?${queryParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (response.ok) {
            const result = await response.json();
            const newIssues = result.data || [];

            if (isLoadMore) {
              setIssues((prev) => [...prev, ...newIssues]);
            } else {
              setIssues(newIssues);
            }

            setHasMore(newIssues.length === ITEMS_PER_PAGE);
          }
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
        toast.error("Failed to load issues");
      } finally {
        setIsLoading(false);
      }
    },
    [
      user,
      filterStatus,
      filterPriority,
      showMyIssuesOnly,
      specificIssueIds,
      issues.length,
    ],
  );

  // Initial Fetch & Filter Changes
  useEffect(() => {
    if (user) {
      // Reset pagination when filters change
      setIssues([]);
      setPage(1);
      fetchIssues(false);
    }
  }, [user, filterStatus, filterPriority, showMyIssuesOnly]);

  // --- Actions ---
  const handleDelete = async (issueId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this issue? This cannot be undone.",
      )
    )
      return;

    setIsDeleting(issueId);
    const token = window.localStorage.getItem("campuscare_token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Issue deleted successfully");
        setIssues((prev) => prev.filter((i) => i.id !== issueId));
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsDeleting(null);
    }
  };

  // Helper for Search (Client-side filtering for responsiveness)
  const filteredIssues =
    specificIssueIds.length > 0
      ? issues
      : issues.filter(
          (issue) =>
            issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            issue.category.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  return (
    <div className="min-h-screen bg-[#050814] text-white pt-24 pb-12 px-4 md:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              {specificIssueIds.length > 0
                ? "Filtered Issues"
                : "Issue Tracker"}
            </h1>
            <p className="text-white/60 mt-1">
              {specificIssueIds.length > 0
                ? `Showing ${specificIssueIds.length} specific issue${specificIssueIds.length > 1 ? "s" : ""} from heatmap`
                : "Manage and track campus infrastructure reports"}
            </p>
          </motion.div>

          <Link href="/report">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all flex items-center gap-2"
            >
              <span>+</span> Report New Issue
            </motion.button>
          </Link>
        </div>

        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-4 backdrop-blur-xl"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-black/40 transition-all"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* My Issues Toggle */}
            <button
              onClick={() => setShowMyIssuesOnly(!showMyIssuesOnly)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                showMyIssuesOnly
                  ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                  : "bg-black/20 border-white/10 text-white/60 hover:bg-white/5"
              }`}
            >
              My Issues
            </button>
          </div>
        </motion.div>

        {/* Issues Grid */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading && issues.length === 0 ? (
              // Loading Skeleton
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white/5 rounded-xl animate-pulse"
                />
              ))
            ) : filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <IssueListItem
                  key={issue.id}
                  issue={issue}
                  userId={user?.id}
                  onDelete={handleDelete}
                  isDeleting={isDeleting === issue.id}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed"
              >
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-xl font-semibold mb-2">No issues found</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  We couldn't find any issues matching your filters. Try
                  adjusting your search or report a new issue.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {hasMore && filteredIssues.length > 0 && !searchQuery && (
          <div className="mt-8 text-center">
            <button
              onClick={() => fetchIssues(true)}
              disabled={isLoading}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm transition-all disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Load More Issues"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-Component: Issue List Item ---
function IssueListItem({ issue, userId, onDelete, isDeleting }: any) {
  const isOwner = userId === issue.reportedBy;
  // TODO: Add isAdmin check if user object is passed down completely

  const getPriorityColor = (p: string) => {
    switch (p?.toLowerCase()) {
      case "critical":
        return "text-rose-400 bg-rose-950/30 border-rose-500/30";
      case "high":
        return "text-orange-400 bg-orange-950/30 border-orange-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-950/30 border-yellow-500/30";
      default:
        return "text-green-400 bg-green-950/30 border-green-500/30";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case "open":
        return "bg-blue-500/20 text-blue-300";
      case "in_progress":
        return "bg-violet-500/20 text-violet-300";
      case "resolved":
        return "bg-green-500/20 text-green-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-violet-500/30 transition-all hover:bg-white/5"
    >
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(issue.priority)}`}
            >
              {issue.priority}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(issue.status)}`}
            >
              {issue.status.replace("_", " ")}
            </span>
            <span className="text-white/40 text-xs">
              •{" "}
              {new Date(
                issue.createdAt._seconds * 1000 || issue.createdAt,
              ).toLocaleDateString()}
            </span>
          </div>

          <Link
            href={`/issues/${issue.id}`}
            className="block group-hover:text-violet-300 transition-colors"
          >
            <h3 className="text-lg font-semibold truncate pr-8">
              {issue.title}
            </h3>
          </Link>
          <p className="text-white/60 text-sm line-clamp-1 mt-1">
            {issue.description}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
            <span className="flex items-center gap-1">🏢 {issue.category}</span>
            {issue.location && (
              <span className="flex items-center gap-1">
                📍 {issue.buildingId || "Campus Map"}
              </span>
            )}
            {issue.images?.length > 0 && (
              <span className="flex items-center gap-1">
                📷 {issue.images.length} Image
                {issue.images.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 md:border-l md:border-white/10 md:pl-6">
          {/* Vote Button */}
          <VoteButton
            issueId={issue.id}
            initialVoteCount={issue.voteCount || 0}
            size="sm"
            showCount={true}
          />

          <Link href={`/issues/${issue.id}`}>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              View Details
            </button>
          </Link>

          {isOwner && (
            <button
              onClick={() => onDelete(issue.id)}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-50"
              title="Delete Issue"
            >
              {isDeleting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
