"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://ciis-production-ebbd.up.railway.app";

interface Issue {
  id: string;
  title: string;
  category: string;
  severity: number;
  priority: string;
  status: string;
  buildingId?: string;
  createdAt: any;
}

interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface AIInsight {
  insights: string;
  analyzedIssues: number;
  timestamp: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [highPriorityIssues, setHighPriorityIssues] = useState<Issue[]>([]);
  const [aiInsight, setAIInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("ciis_token")
        : null;
    const userStr =
      typeof window !== "undefined"
        ? window.localStorage.getItem("ciis_user")
        : null;

    if (!token || !userStr) {
      toast.error("Please log in to access dashboard");
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      await Promise.all([
        loadStats(userData),
        loadRecentIssues(userData),
        loadHighPriorityIssues(userData),
        loadAIInsights(userData),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (userData: any) => {
    try {
      const token = window.localStorage.getItem("ciis_token");
      const response = await fetch(
        `${API_BASE_URL}/api/issues/stats?organizationId=${userData.organizationId || "ggv-bilaspur"}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Map backend stats to our interface
          setStats({
            total: result.data.total || 0,
            open: result.data.open || 0,
            inProgress: result.data.inProgress || 0,
            resolved: result.data.resolved || 0,
            closed: result.data.closed || 0,
            critical: result.data.byPriority?.critical || 0,
            high: result.data.byPriority?.high || 0,
            medium: result.data.byPriority?.medium || 0,
            low: result.data.byPriority?.low || 0,
          });
        }
      } else if (response.status === 403) {
        // User doesn't have permission (not Facility Manager/Admin)
        // That's okay, we'll just not show stats
        console.log("Stats not available for this user role");
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      // Stats might not be available for all roles, that's okay
    }
  };

  const loadRecentIssues = async (userData: any) => {
    try {
      const token = window.localStorage.getItem("ciis_token");
      const response = await fetch(
        `${API_BASE_URL}/api/issues?organizationId=${userData.organizationId || "ggv-bilaspur"}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.issues) {
          setRecentIssues(result.data.issues);
        }
      }
    } catch (error) {
      console.error("Error loading recent issues:", error);
    }
  };

  const loadHighPriorityIssues = async (userData: any) => {
    try {
      const token = window.localStorage.getItem("ciis_token");
      const response = await fetch(
        `${API_BASE_URL}/api/issues/priorities?organizationId=${userData.organizationId || "ggv-bilaspur"}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setHighPriorityIssues(Array.isArray(result.data) ? result.data : []);
        }
      }
    } catch (error) {
      console.error("Error loading high priority issues:", error);
    }
  };

  const loadAIInsights = async (userData: any) => {
    try {
      const token = window.localStorage.getItem("ciis_token");
      const response = await fetch(`${API_BASE_URL}/api/ai/insights`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAIInsight(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading AI insights:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "text-rose-400 bg-rose-950/40 border-rose-500/30";
      case "high":
        return "text-orange-400 bg-orange-950/40 border-orange-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-950/40 border-yellow-500/30";
      case "low":
        return "text-green-400 bg-green-950/40 border-green-500/30";
      default:
        return "text-white/60 bg-white/5 border-white/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "text-blue-400 bg-blue-950/40";
      case "in_progress":
        return "text-violet-400 bg-violet-950/40";
      case "resolved":
        return "text-green-400 bg-green-950/40";
      case "closed":
        return "text-gray-400 bg-gray-950/40";
      default:
        return "text-white/60 bg-white/5";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#050814]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
            <p className="text-white/60">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050814] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse-slower" />
      </div>

      <main className="pt-24 pb-12 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome back,
            <span className="ml-3 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              {user?.name || "User"}
            </span>
          </h1>
          <p className="text-white/60 text-lg">
            Campus Infrastructure Intelligence Dashboard
          </p>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <StatCard
              label="Total Issues"
              value={stats.total}
              icon="📊"
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              label="Open"
              value={stats.open}
              icon="🔴"
              gradient="from-rose-500 to-pink-500"
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon="🟡"
              gradient="from-yellow-500 to-orange-500"
            />
            <StatCard
              label="Resolved"
              value={stats.resolved}
              icon="🟢"
              gradient="from-green-500 to-emerald-500"
            />
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="Heatmap View"
              description="Visualize infrastructure issues on campus map"
              icon="🗺️"
              href="/heatmap"
              gradient="from-violet-600 to-fuchsia-600"
            />
            <QuickActionCard
              title="Priorities"
              description="View high-priority issues requiring attention"
              icon="⚡"
              href="/priority"
              gradient="from-orange-600 to-red-600"
            />
            <QuickActionCard
              title="Report Issue"
              description="Report a new infrastructure issue"
              icon="📝"
              href="/report"
              gradient="from-emerald-600 to-teal-600"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High Priority Issues */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">High Priority Issues</h2>
              <Link
                href="/priority"
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {highPriorityIssues.length > 0 ? (
                highPriorityIssues
                  .slice(0, 5)
                  .map((issue) => <IssueCard key={issue.id} issue={issue} />)
              ) : (
                <p className="text-white/40 text-sm py-4 text-center">
                  No high-priority issues at the moment
                </p>
              )}
            </div>
          </motion.div>

          {/* Recent Issues */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Issues</h2>
              <Link
                href="/issues"
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {recentIssues.length > 0 ? (
                recentIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))
              ) : (
                <p className="text-white/40 text-sm py-4 text-center">
                  No recent issues
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        {aiInsight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-gradient-to-br from-violet-950/40 to-fuchsia-950/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-3">
                  {aiInsight.insights}
                </p>
                <p className="text-xs text-white/40">
                  Analyzed {aiInsight.analyzedIssues} issues •{" "}
                  {new Date(aiInsight.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );

  function StatCard({
    label,
    value,
    icon,
    gradient,
  }: {
    label: string;
    value: number;
    icon: string;
    gradient: string;
  }) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{icon}</span>
          <span
            className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
          >
            {value}
          </span>
        </div>
        <p className="text-xs text-white/60">{label}</p>
      </div>
    );
  }

  function QuickActionCard({
    title,
    description,
    icon,
    href,
    gradient,
  }: {
    title: string;
    description: string;
    icon: string;
    href: string;
    gradient: string;
  }) {
    return (
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`bg-gradient-to-br ${gradient} rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-violet-500/25`}
        >
          <div className="text-3xl mb-3">{icon}</div>
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          <p className="text-white/80 text-sm">{description}</p>
        </motion.div>
      </Link>
    );
  }

  function IssueCard({ issue }: { issue: Issue }) {
    return (
      <Link href={`/issues/${issue.id}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-white text-sm flex-1 line-clamp-1">
              {issue.title}
            </h4>
            <span
              className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-medium border ${getPriorityColor(
                issue.priority
              )}`}
            >
              {issue.priority}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="capitalize">{issue.category}</span>
            <span>•</span>
            <span
              className={`px-2 py-0.5 rounded ${getStatusColor(issue.status)}`}
            >
              {issue.status.replace("_", " ")}
            </span>
            <span>•</span>
            <span>Severity: {issue.severity}/10</span>
          </div>
          <p className="text-xs text-white/40 mt-2">
            {formatDate(issue.createdAt)}
          </p>
        </motion.div>
      </Link>
    );
  }
}
