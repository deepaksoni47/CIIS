"use client";

import { useEffect, useState } from "react";
import {
  getDashboardOverview,
  AdminDashboardOverview,
} from "@/lib/adminService";
import {
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!overview) return null;

  const statCards = [
    {
      title: "Total Users",
      value: overview.userStats.total,
      subtitle: `${overview.userStats.active} active`,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Issues",
      value: overview.issueStats.total,
      subtitle: `${overview.issueStats.open} open`,
      icon: FileText,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Resolved Issues",
      value: overview.issueStats.resolved,
      subtitle: `${Math.round((overview.issueStats.resolved / overview.issueStats.total) * 100)}% rate`,
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Critical Issues",
      value: overview.issueStats.bySeverity.critical,
      subtitle: "Requires attention",
      icon: AlertTriangle,
      color: "from-red-500 to-orange-500",
    },
    {
      title: "Avg Resolution",
      value: `${overview.issueStats.avgResolutionTime}h`,
      subtitle: "Response time",
      icon: Clock,
      color: "from-indigo-500 to-purple-500",
    },
    {
      title: "In Progress",
      value: overview.issueStats.inProgress,
      subtitle: "Active work",
      icon: Activity,
      color: "from-yellow-500 to-amber-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mt-20" >
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of system metrics and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {card.value}
                </h3>
                <p className="text-gray-500 text-xs">{card.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Stats by Role */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Users by Role</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(overview.userStats.byRole).map(([role, count]) => (
            <div
              key={role}
              className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700"
            >
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-sm text-gray-400 capitalize mt-1">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Issues */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Issues</h2>
          <a
            href="/admin/issues"
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            View All →
          </a>
        </div>
        <div className="space-y-3">
          {overview.recentIssues.slice(0, 5).map((issue: any) => (
            <div
              key={issue.id}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">{issue.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="capitalize">{issue.category}</span>
                  <span>•</span>
                  <span>{issue.buildingName}</span>
                  <span>•</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  issue.status === "open"
                    ? "bg-blue-900/30 text-blue-400"
                    : issue.status === "in-progress"
                      ? "bg-yellow-900/30 text-yellow-400"
                      : issue.status === "resolved"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-gray-700 text-gray-300"
                }`}
              >
                {issue.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Users</h2>
          <a
            href="/admin/users"
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            View All →
          </a>
        </div>
        <div className="space-y-3">
          {overview.recentUsers.slice(0, 5).map((user: any) => (
            <div
              key={user.uid}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    {user.displayName || "Anonymous"}
                  </h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 capitalize">
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      {overview.topContributors && overview.topContributors.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Top Contributors
          </h2>
          <div className="space-y-3">
            {overview.topContributors
              .slice(0, 5)
              .map((contributor: any, index: number) => (
                <div
                  key={contributor.uid}
                  className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="text-2xl font-bold text-purple-400">
                    #{index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                    {contributor.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">
                      {contributor.displayName || "Anonymous"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {contributor.issuesReported} issues reported
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {contributor.totalVotes}
                    </p>
                    <p className="text-xs text-gray-400">votes received</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
