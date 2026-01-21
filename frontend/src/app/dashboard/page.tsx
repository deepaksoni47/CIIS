"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { clearAuthTokens, getValidUser } from "@/lib/tokenManager";
import {
  BadgeAlert,
  SquareArrowOutUpRight,
  MapPinCheck,
  Workflow,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

// --- Types ---
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

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "staff" | "facility_manager" | "admin";
  organizationId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  // Prevent multiple toasts
  let toastShown = false;

  // State
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [highPriorityIssues, setHighPriorityIssues] = useState<Issue[]>([]);
  const [aiInsight, setAIInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Use centralized token validation
        const userDataRaw = getValidUser();
        // Type guard: ensure userDataRaw is UserData
        if (
          !userDataRaw ||
          typeof userDataRaw !== "object" ||
          typeof userDataRaw.id !== "string" ||
          typeof userDataRaw.name !== "string" ||
          typeof userDataRaw.email !== "string" ||
          typeof userDataRaw.role !== "string" ||
          typeof userDataRaw.organizationId !== "string"
        ) {
          if (
            typeof window !== "undefined" &&
            window.location.pathname !== "/login"
          ) {
            if (!toastShown) {
              toastShown = true;
              toast.error("Please log in to access dashboard");
            }
            router.push("/login");
          }
          return;
        }
        const userData: UserData = {
          id: userDataRaw.id,
          name: userDataRaw.name,
          email: userDataRaw.email,
          role: userDataRaw.role as UserData["role"],
          organizationId: userDataRaw.organizationId,
        };
        setUser(userData);

        // Debug: show whether a token exists and the user's role (do not print token)
        if (typeof window !== "undefined") {
          const t = window.localStorage.getItem("campuscare_token");
          console.debug(
            "Dashboard: token present=",
            !!t,
            "userRole=",
            userData.role,
          );
        }

        const isManagerOrAdmin = ["facility_manager", "admin"].includes(
          userData.role,
        );

        await Promise.all([
          // Only load global stats for Managers/Admins to avoid 403 errors
          isManagerOrAdmin ? loadStats(userData) : Promise.resolve(),
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
    checkAuthAndLoadData();
  }, []);

  const loadStats = async (userData: UserData) => {
    try {
      const token = window.localStorage.getItem("campuscare_token");
      const response = await fetch(
        `${API_BASE_URL}/api/issues/stats?organizationId=${userData.organizationId || "ggv-bilaspur"}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Handle invalid/expired token
      if (response.status === 401) {
        clearAuthTokens();
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
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
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadRecentIssues = async (userData: UserData) => {
    try {
      const token = window.localStorage.getItem("campuscare_token");

      // Filter logic: Students see only their issues, Managers see all
      let query = `organizationId=${userData.organizationId || "ggv-bilaspur"}&limit=5`;

      if (userData.role === "student") {
        query += `&reportedBy=${userData.id}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/issues?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        console.warn("Dashboard: received 401 when fetching recent issues");
        clearAuthTokens();
        toast.error("Session expired — please sign in again");
        router.push("/login");
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Verify data structure (some backends return array directly, some inside .issues)
          const issuesData = Array.isArray(result.data)
            ? result.data
            : result.data.issues;
          setRecentIssues(issuesData || []);
        }
      }
    } catch (error) {
      console.error("Error loading recent issues:", error);
    }
  };

  const loadHighPriorityIssues = async (userData: UserData) => {
    try {
      const token = window.localStorage.getItem("campuscare_token");
      const response = await fetch(
        `${API_BASE_URL}/api/issues/priorities?organizationId=${userData.organizationId || "ggv-bilaspur"}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        console.warn("Dashboard: received 401 when fetching priority issues");
        clearAuthTokens();
        toast.error("Session expired — please sign in again");
        router.push("/login");
        return;
      }

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

  const loadAIInsights = async (userData: UserData) => {
    try {
      const token = window.localStorage.getItem("campuscare_token");
      const response = await fetch(`${API_BASE_URL}/api/ai/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        console.warn("Dashboard: received 401 when fetching AI insights");
        clearAuthTokens();
        toast.error("Session expired — please sign in again");
        router.push("/login");
        return;
      }

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

  // --- UI Helpers ---
  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-rose-500/20 text-rose-300 border-rose-500/50";
      case "facility_manager":
        return "bg-violet-500/20 text-violet-300 border-violet-500/50";
      case "staff":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "faculty":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"; // Student
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

  // --- Render Loading or block unauthorized ---
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

  // If not authenticated, render nothing (prevents cached/unauthorized view)
  if (!user) {
    return null;
  }

  // Define actions based on role
  const isManager = ["admin", "facility_manager"].includes(user?.role || "");

  return (
    <div className="relative min-h-screen bg-[#050814] text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse-slower" />
      </div>

      <main className="pt-24 pb-12 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header with Role Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Welcome back,
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span>
                <span className="mr-3 gradient-heading bg-clip-text text-transparent text-4xl md:text-5xl font-bold mb-2">
                  {user?.name || "User"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRoleBadgeColor(user?.role)}`}
                >
                  {user?.role?.replace("_", " ") || "Student"}
                </span>
              </span>
              
            </div>
              <p className="text-white/60 text-lg">
                Campus Infrastructure Intelligence
              </p>
          </div>
        </motion.div>

        {/* Stats Grid - Only visible to Managers/Admins */}
        {isManager && stats ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-8"
          >
            <StatCard
              label="Total Issues"
              value={stats.total}
              icon=<BadgeAlert />
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              label="Open"
              value={stats.open}
              icon=<SquareArrowOutUpRight />
              gradient="from-rose-500 to-pink-500"
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon=<Workflow />
              gradient="from-yellow-500 to-orange-500"
            />
            <StatCard
              label="Resolved"
              value={stats.resolved}
              icon=<MapPinCheck />
              gradient="from-green-500 to-emerald-500"
            />
          </motion.div>
        ) : (
          /* Simplified Welcome Stats for Students */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
          >
            <div>
              <h3 className="text-xl font-semibold mb-1">My Activity</h3>
              <p className="text-white/60 text-sm">
                You have reported {recentIssues.length} active issues recently.
              </p>
            </div>
            {/* <Link href="/issues">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                    View History
                </button>
            </Link> */}
          </motion.div>
        )}

        {/* Dynamic Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action 1: Report (Everyone) */}
            <QuickActionCard
              title="Heatmap View"
              description="Visualize infrastructure issues on campus map"
              icon="🗺️"
              href="/heatmap"
              gradient="from-violet-600 to-fuchsia-600"
            />
            <QuickActionCard
              title="Report Issue"
              description="Report a new infrastructure issue"
              icon="📝"
              href="/report"
              gradient="from-emerald-600 to-teal-600"
            />

            {/* Action 2: Role Based */}
            {isManager ? (
              <QuickActionCard
                title="Priorities"
                description="View critical issues requiring attention"
                icon="⚡"
                href="/priorities"
                gradient="from-orange-600 to-red-600"
              />
            ) : (
              <QuickActionCard
                title="My Issues"
                description="Track status of your reported issues"
                icon="📋"
                href="/issues"
                gradient="from-blue-600 to-indigo-600"
              />
            )}

            {/* Action 3: Leaderboard (Everyone) */}
            <QuickActionCard
              title="Leaderboard"
              description="View community rankings and achievements"
              icon="🏆"
              href="/profile?tab=leaderboard"
              gradient="from-yellow-600 to-orange-600"
            />
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High Priority Issues (Visible to everyone, but content might differ) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {isManager ? "High Priority Issues" : "Campus Alerts"}
              </h2>
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
                  No high-priority alerts
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
              <h2 className="text-xl font-semibold">
                {isManager ? "Recent Reports" : "My Recent Reports"}
              </h2>
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
                  {isManager
                    ? "No recent issues reported"
                    : "You haven't reported any issues yet"}
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
                <span className="text-2xl">🤖</span>
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

  // Sub-components (kept same as your original code)
  function StatCard({ label, value, icon, gradient }: any) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2 gap-4">
          <span className="w-2 h-5 md:text-2xl">{icon}</span>
          <span
            className={`text-lg md:text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
          >
            {value}
          </span>
        </div>
        <p className="text-xs text-white/60">{label}</p>
      </div>
    );
  }

  function QuickActionCard({ title, description, icon, href, gradient }: any) {
    return (
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`bg-gradient-to-br ${gradient} rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-violet-500/25 h-full`}
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
          className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl p-4 transition-all cursor-pointer mb-3"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-white text-sm flex-1 line-clamp-1">
              {issue.title}
            </h4>
            <span
              className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-medium border ${getPriorityColor(issue.priority)}`}
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
